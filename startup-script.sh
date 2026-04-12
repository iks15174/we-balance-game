#!/bin/bash
# =============================================================
# 통합 GCP VM 스타트업/배포 스크립트
# GDP 스피드 퀴즈 + 우리사이 밸런스 게임
#
# 사용법:
#   전체 초기 셋업 (VM 최초 시작):  bash startup.sh
#   GDP 퀴즈만 재배포:              bash startup.sh gdp
#   밸런스 게임만 재배포:           bash startup.sh balance
#
# ── VM 메타데이터 키 목록 ──────────────────────────────────
# [공통]
#   db-password        : PostgreSQL gdpuser 비밀번호 (두 앱 공용)
#   admin-email        : Let's Encrypt 이메일
#
# [GDP 퀴즈]
#   api-key            : 공공데이터 API 키
#   app-name           : 앱인토스 앱 이름 (예: gdp-economy-quiz)
#   git-repo           : GDP 퀴즈 git clone URL
#   ait-decrypt-key    : 앱인토스 복호화 키
#   ait-decrypt-aad    : 앱인토스 복호화 AAD
#   ait-unlink-secret  : 앱인토스 unlink 시크릿
#   ait-mtls-cert-b64  : mTLS 공개 인증서 (base64)
#   ait-mtls-key-b64   : mTLS 개인 키 (base64)
#   ait-promotion-code : 프로모션 코드 ID
#
# [밸런스 게임]
#   balance-git-repo   : 밸런스 게임 git clone URL
#   balance-admin-key  : 어드민 API 시크릿 (X-Admin-Key 헤더용)
#   balance-branch     : 브랜치 이름 (기본값: main)
# =============================================================

set -e

# ── 인자 파싱 ─────────────────────────────────────────────
TARGET="${1:-all}"   # gdp | balance | all(기본)

LOG="/var/log/startup-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

echo "========================================"
echo "배포 시작: $(date)  대상: $TARGET"
echo "========================================"

# ── 메타데이터 읽기 ────────────────────────────────────────
META="http://metadata.google.internal/computeMetadata/v1/instance/attributes"
H="Metadata-Flavor: Google"
_meta() { curl -sf -H "$H" "$META/$1" || echo "${2:-}"; }

DB_PASSWORD=$(_meta db-password)
ADMIN_EMAIL=$(_meta admin-email "admin@example.com")

# GDP
API_KEY=$(_meta api-key)
APP_NAME=$(_meta app-name "gdp-economy-quiz")
GIT_REPO=$(_meta git-repo)
AIT_DECRYPT_KEY=$(_meta ait-decrypt-key)
AIT_DECRYPT_AAD=$(_meta ait-decrypt-aad)
AIT_UNLINK_SECRET=$(_meta ait-unlink-secret)
AIT_MTLS_CERT_B64=$(_meta ait-mtls-cert-b64)
AIT_MTLS_KEY_B64=$(_meta ait-mtls-key-b64)
AIT_PROMOTION_CODE=$(_meta ait-promotion-code)

# Balance game
BALANCE_GIT_REPO=$(_meta balance-git-repo)
BALANCE_ADMIN_KEY=$(_meta balance-admin-key "change-me")
BALANCE_BRANCH=$(_meta balance-branch "main")

# 도메인 계산
PUBLIC_IP=$(curl -sf -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/externalIp" \
  || curl -sf "https://api.ipify.org" || echo "")
DOMAIN="${PUBLIC_IP//./-}.nip.io"

# 필수값 검증
_require() {
  [ -z "$2" ] && { echo "ERROR: 메타데이터 '$1' 가 설정되지 않았습니다."; exit 1; }
}
_require "db-password" "$DB_PASSWORD"
[ "$TARGET" = "all" ] || [ "$TARGET" = "gdp" ]     && _require "git-repo" "$GIT_REPO"
[ "$TARGET" = "all" ] || [ "$TARGET" = "gdp" ]     && _require "api-key" "$API_KEY"
[ "$TARGET" = "all" ] || [ "$TARGET" = "balance" ] && _require "balance-git-repo" "$BALANCE_GIT_REPO"

APP_USER="appuser"
GDP_REPO_DIR="/app/gdp-worldcup"
GDP_APP_DIR="$GDP_REPO_DIR/apps/be"
GDP_PORT=4000
GDP_PM2_NAME="gdp-worldcup-be"

BALANCE_REPO_DIR="/app/we-balance-game"
BALANCE_APP_DIR="$BALANCE_REPO_DIR/backend"
BALANCE_PORT=4001
BALANCE_PM2_NAME="we-balance-game-be"

DB_NAME="gdpworldcup"
DB_USER="gdpuser"

# ══════════════════════════════════════════════════════════════
# 공통 인프라 함수 (멱등성 보장 — 이미 설치된 경우 건너뜀)
# ══════════════════════════════════════════════════════════════

setup_system() {
  if [ -f /var/startup-system-done ]; then echo "[시스템] 이미 셋업됨, 건너뜀"; return; fi
  echo "[시스템] 패키지 업데이트..."
  apt-get update -qq && apt-get upgrade -y -qq
  touch /var/startup-system-done
}

setup_tools() {
  # git
  command -v git &>/dev/null || apt-get install -y git
  # nginx + certbot
  if ! command -v nginx &>/dev/null; then
    apt-get install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
  fi
  # Node.js 20
  if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
  # pm2
  command -v pm2 &>/dev/null || npm install -g pm2
  echo "[도구] git=$(git --version), node=$(node -v), pm2=$(pm2 -v)"
}

setup_postgresql() {
  if ! command -v psql &>/dev/null; then
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
  fi
  systemctl start postgresql

  # DB 유저 & DB 생성 (멱등성)
  sudo -u postgres psql -q <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
  echo "[PostgreSQL] DB=$DB_NAME, USER=$DB_USER 준비 완료"
}

setup_app_user() {
  id "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
}

# ── nginx 설정 ────────────────────────────────────────────
# /          → GDP 퀴즈 (4000)
# /balance/  → 밸런스 게임 (4001)
setup_nginx() {
  local domain="$1"
  echo "[nginx] 설정 업데이트..."

  # Let's Encrypt 인증서 발급
  if [ -z "$PUBLIC_IP" ]; then
    echo "[nginx] 공인 IP 없음, HTTPS 설정 건너뜀"
    return
  fi

  # 임시 HTTP 설정으로 certbot 준비
  if [ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
    cat > /etc/nginx/sites-available/app <<NGINX_TMP
server {
    listen 80;
    server_name $domain;
    location / { return 200 'ok'; }
}
NGINX_TMP
    ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    rm -rf /etc/letsencrypt
    certbot certonly --nginx -d "$domain" --non-interactive --agree-tos \
      --register-unsafely-without-email
  else
    certbot renew --quiet
  fi

  # HTTPS 설정: path 기반 라우팅
  cat > /etc/nginx/sites-available/app <<NGINX
server {
    listen 80;
    server_name $domain;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $domain;

    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ── 밸런스 게임 (port $BALANCE_PORT) ──────────────────
    # trailing slash 가 /balance/ prefix를 제거 후 전달
    location /balance/ {
        proxy_pass http://localhost:$BALANCE_PORT/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ── GDP 퀴즈 (port $GDP_PORT) ─────────────────────────
    location / {
        proxy_pass http://localhost:$GDP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

  ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "[nginx] 설정 완료"
  echo "  GDP  퀴즈  : https://$domain/"
  echo "  밸런스게임 : https://$domain/balance/"
}

# ══════════════════════════════════════════════════════════════
# GDP 퀴즈 배포
# ══════════════════════════════════════════════════════════════
deploy_gdp() {
  echo "──────────────────────────────────────"
  echo "GDP 퀴즈 배포 시작"
  echo "──────────────────────────────────────"

  # 코드 배포
  mkdir -p "$GDP_REPO_DIR"
  git config --global --add safe.directory "$GDP_REPO_DIR"
  if [ -d "$GDP_REPO_DIR/.git" ]; then
    git -C "$GDP_REPO_DIR" fetch origin
    git -C "$GDP_REPO_DIR" reset --hard origin/master
  else
    git clone "$GIT_REPO" "$GDP_REPO_DIR"
  fi
  chown -R "$APP_USER":"$APP_USER" "$GDP_REPO_DIR"

  # mTLS 인증서
  mkdir -p "$GDP_APP_DIR/certs"
  [ -n "$AIT_MTLS_CERT_B64" ] && \
    echo "$AIT_MTLS_CERT_B64" | base64 -d > "$GDP_APP_DIR/certs/gdp-quiz-login_public.crt"
  [ -n "$AIT_MTLS_KEY_B64" ] && \
    echo "$AIT_MTLS_KEY_B64" | base64 -d > "$GDP_APP_DIR/certs/gdp-quiz-login_private.key"
  chmod 600 "$GDP_APP_DIR/certs/"* 2>/dev/null || true
  chown -R "$APP_USER":"$APP_USER" "$GDP_APP_DIR/certs"

  # .env
  cat > "$GDP_APP_DIR/.env" <<ENV
NODE_ENV=production
PORT=$GDP_PORT
TZ=Asia/Seoul
APP_NAME=$APP_NAME
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PUBLIC_DATA_API_KEY=$API_KEY
PUBLIC_DATA_API_BASE_URL=http://apis.data.go.kr/1262000/OverviewEconomicService/OverviewEconomicList
COUNTRY_CACHE_TTL_SECONDS=604800
AIT_DECRYPT_KEY=$AIT_DECRYPT_KEY
AIT_DECRYPT_AAD=$AIT_DECRYPT_AAD
AIT_UNLINK_SECRET=$AIT_UNLINK_SECRET
AIT_MTLS_CERT_PATH=./certs/gdp-quiz-login_public.crt
AIT_MTLS_KEY_PATH=./certs/gdp-quiz-login_private.key
AIT_PROMOTION_CODE=$AIT_PROMOTION_CODE
AIT_PROMOTION_AMOUNT=1
ENV
  chown "$APP_USER":"$APP_USER" "$GDP_APP_DIR/.env"
  chmod 600 "$GDP_APP_DIR/.env"

  # 빌드
  cd "$GDP_APP_DIR"
  sudo -u "$APP_USER" npm install
  sudo -u "$APP_USER" npx prisma generate
  sudo -u "$APP_USER" npx prisma db push --accept-data-loss
  sudo -u "$APP_USER" npm run build

  # pm2
  pm2 delete "$GDP_PM2_NAME" 2>/dev/null || true
  pm2 start "$GDP_APP_DIR/dist/index.js" \
    --name "$GDP_PM2_NAME" \
    --node-args="--env-file=$GDP_APP_DIR/.env"
  pm2 save
  env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root
  systemctl enable pm2-root

  echo "[GDP] 배포 완료 (port $GDP_PORT)"
}

# ══════════════════════════════════════════════════════════════
# 밸런스 게임 배포
# ══════════════════════════════════════════════════════════════
deploy_balance() {
  echo "──────────────────────────────────────"
  echo "밸런스 게임 배포 시작"
  echo "──────────────────────────────────────"

  # 코드 배포
  mkdir -p "$BALANCE_REPO_DIR"
  git config --global --add safe.directory "$BALANCE_REPO_DIR"
  if [ -d "$BALANCE_REPO_DIR/.git" ]; then
    git -C "$BALANCE_REPO_DIR" fetch origin
    git -C "$BALANCE_REPO_DIR" reset --hard "origin/$BALANCE_BRANCH"
  else
    git clone "$BALANCE_GIT_REPO" "$BALANCE_REPO_DIR"
  fi
  chown -R "$APP_USER":"$APP_USER" "$BALANCE_REPO_DIR"

  # .env
  # DATABASE_URL 에 ?schema=balance 추가 → gdpworldcup DB 내 balance 스키마 사용
  cat > "$BALANCE_APP_DIR/.env" <<ENV
NODE_ENV=production
PORT=$BALANCE_PORT
TZ=Asia/Seoul
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=balance
ADMIN_SECRET_KEY=$BALANCE_ADMIN_KEY
ENV
  chown "$APP_USER":"$APP_USER" "$BALANCE_APP_DIR/.env"
  chmod 600 "$BALANCE_APP_DIR/.env"

  # 빌드
  cd "$BALANCE_APP_DIR"
  sudo -u "$APP_USER" npm install
  sudo -u "$APP_USER" npx prisma generate
  sudo -u "$APP_USER" npx prisma db push --accept-data-loss
  sudo -u "$APP_USER" npm run db:seed || echo "  seed 이미 존재, 건너뜀"
  sudo -u "$APP_USER" npm run build

  # pm2
  pm2 delete "$BALANCE_PM2_NAME" 2>/dev/null || true
  pm2 start "$BALANCE_APP_DIR/dist/app.js" \
    --name "$BALANCE_PM2_NAME" \
    --node-args="--env-file=$BALANCE_APP_DIR/.env"
  pm2 save
  env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root
  systemctl enable pm2-root

  echo "[밸런스] 배포 완료 (port $BALANCE_PORT)"
}

# ══════════════════════════════════════════════════════════════
# 메인 실행 흐름
# ══════════════════════════════════════════════════════════════
case "$TARGET" in
  gdp)
    # GDP만 재배포 (인프라 공통 셋업은 이미 되어 있다고 가정)
    setup_postgresql
    deploy_gdp
    ;;
  balance)
    # 밸런스게임만 재배포
    setup_postgresql
    deploy_balance
    setup_nginx "$DOMAIN"
    ;;
  all|*)
    # 최초 전체 셋업 또는 전체 재배포
    setup_system
    setup_tools
    setup_postgresql
    setup_app_user
    deploy_gdp
    deploy_balance
    setup_nginx "$DOMAIN"
    ;;
esac

# ── 완료 요약 ─────────────────────────────────────────────
echo ""
echo "========================================"
echo "배포 완료: $(date)"
echo ""
case "$TARGET" in
  gdp)
    echo "GDP 퀴즈  : https://$DOMAIN/"
    echo "헬스 체크 : curl https://$DOMAIN/health"
    ;;
  balance)
    echo "밸런스 게임 API : https://$DOMAIN/balance"
    echo "헬스 체크       : curl https://$DOMAIN/balance/health"
    echo "Admin 예시      : curl -H 'X-Admin-Key: $BALANCE_ADMIN_KEY' \\"
    echo "                    https://$DOMAIN/balance/api/admin/topics"
    echo ""
    echo "프론트 .env 설정:"
    echo "  VITE_API_URL=https://$DOMAIN/balance"
    ;;
  *)
    echo "GDP  퀴즈  : https://$DOMAIN/"
    echo "밸런스게임 : https://$DOMAIN/balance"
    echo "헬스 체크  : curl https://$DOMAIN/health"
    echo "             curl https://$DOMAIN/balance/health"
    ;;
esac
echo "========================================"

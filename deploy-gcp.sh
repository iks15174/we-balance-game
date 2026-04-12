#!/bin/bash
# =============================================================
# 우리사이 밸런스 게임 — GCP VM 배포 스크립트
# 기존 GDP 퀴즈 앱이 동일 VM에서 port 4000으로 실행 중인 상태를 전제로 합니다.
# 이 앱은 port 4001 로 뜨고, nginx 에서 /balance/ 경로로 라우팅됩니다.
#
# 사용법:
#   1. VM에서 직접 실행: sudo bash deploy-gcp.sh
#   2. 또는 GCP VM 메타데이터의 startup-script에 기존 GDP 스크립트 뒤에 추가
#
# 필요한 VM 메타데이터 (기존 GDP 메타데이터 외 추가):
#   balance-db-password : PostgreSQL balance_game DB 비밀번호
#   balance-git-repo    : 이 레포 git clone URL
#   balance-admin-key   : Admin API 시크릿 키
# =============================================================

set -e

LOG="/var/log/balance-game-deploy.log"
exec > >(tee -a "$LOG") 2>&1

echo "========================================"
echo "밸런스 게임 배포 시작: $(date)"
echo "========================================"

# ----------------------------------------------------
# 메타데이터 읽기
# ----------------------------------------------------
META="http://metadata.google.internal/computeMetadata/v1/instance/attributes"
H="Metadata-Flavor: Google"

BALANCE_DB_PASSWORD=$(curl -sf -H "$H" "$META/balance-db-password" || echo "")
BALANCE_GIT_REPO=$(curl -sf -H "$H" "$META/balance-git-repo" || echo "")
BALANCE_ADMIN_KEY=$(curl -sf -H "$H" "$META/balance-admin-key" || echo "change-me-in-production")

# 공인 IP → nip.io 도메인 (기존 GDP 스크립트와 동일 방식)
PUBLIC_IP=$(curl -sf -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/externalIp" \
  || curl -sf "https://api.ipify.org" || echo "")
DOMAIN="${PUBLIC_IP//./-}.nip.io"

if [ -z "$BALANCE_DB_PASSWORD" ]; then
  echo "ERROR: 메타데이터 'balance-db-password' 가 설정되지 않았습니다."
  exit 1
fi
if [ -z "$BALANCE_GIT_REPO" ]; then
  echo "ERROR: 메타데이터 'balance-git-repo' 가 설정되지 않았습니다."
  exit 1
fi

REPO_DIR="/app/we-balance-game"
APP_DIR="$REPO_DIR/backend"
APP_USER="appuser"
APP_PORT=4001
DB_NAME="balance_game"
DB_USER="balanceuser"

# ----------------------------------------------------
# 1. DB & 유저 생성
# ----------------------------------------------------
echo "[1] DB 설정..."
systemctl start postgresql
sudo -u postgres psql -q <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$BALANCE_DB_PASSWORD';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
echo "  DB 준비 완료"

# ----------------------------------------------------
# 2. 코드 배포
# ----------------------------------------------------
echo "[2] 코드 배포..."
mkdir -p "$REPO_DIR"
git config --global --add safe.directory "$REPO_DIR"

if [ -d "$REPO_DIR/.git" ]; then
  echo "  git pull..."
  git -C "$REPO_DIR" fetch origin
  git -C "$REPO_DIR" reset --hard origin/main
else
  echo "  git clone..."
  git clone "$BALANCE_GIT_REPO" "$REPO_DIR"
fi
chown -R "$APP_USER":"$APP_USER" "$REPO_DIR"

# ----------------------------------------------------
# 3. .env 생성
# ----------------------------------------------------
echo "[3] .env 생성..."
cat > "$APP_DIR/.env" <<ENV
NODE_ENV=production
PORT=$APP_PORT
TZ=Asia/Seoul
DATABASE_URL=postgresql://$DB_USER:$BALANCE_DB_PASSWORD@localhost:5432/$DB_NAME
ADMIN_SECRET_KEY=$BALANCE_ADMIN_KEY
ENV
chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

# ----------------------------------------------------
# 4. 패키지 설치 & Prisma & 빌드
# ----------------------------------------------------
echo "[4] 패키지 설치 & 빌드..."
cd "$APP_DIR"
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npx prisma generate
sudo -u "$APP_USER" npx prisma db push --accept-data-loss
# 초기 데이터 (이미 seeded 되어 있으면 upsert 이므로 멱등성 보장)
sudo -u "$APP_USER" npm run db:seed || echo "  Seed 완료 또는 이미 존재"
sudo -u "$APP_USER" npm run build

# ----------------------------------------------------
# 5. pm2 실행
# ----------------------------------------------------
echo "[5] pm2 시작..."
pm2 delete we-balance-game-be 2>/dev/null || true
pm2 start "$APP_DIR/dist/app.js" \
  --name we-balance-game-be \
  --node-args="--env-file=$APP_DIR/.env"
pm2 save
echo "  pm2 we-balance-game-be 시작 완료 (port $APP_PORT)"

# ----------------------------------------------------
# 6. nginx /balance/ 라우팅 추가
# ----------------------------------------------------
echo "[6] nginx 설정 업데이트..."

# 기존 gdp-api nginx 설정 파일에 /balance/ location 블록 추가
# 이미 추가된 경우 건너뜀
NGINX_CONF="/etc/nginx/sites-available/gdp-api"

if grep -q "location /balance/" "$NGINX_CONF" 2>/dev/null; then
  echo "  nginx /balance/ 블록 이미 존재, 건너뜀"
else
  echo "  nginx /balance/ 블록 추가..."
  # HTTPS server 블록 내의 'location /' 앞에 /balance/ 블록 삽입
  # sed로 'location / {' 바로 앞에 삽입
  sed -i '/location \/ {/i\    # 우리사이 밸런스 게임 API (port 4001)\n    location /balance/ {\n        proxy_pass http:\/\/localhost:'"$APP_PORT"'\/;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n' "$NGINX_CONF"
fi

nginx -t && systemctl reload nginx
echo "  nginx 재시작 완료"

# ----------------------------------------------------
# 완료
# ----------------------------------------------------
echo "========================================"
echo "배포 완료: $(date)"
echo ""
echo "API 기본 URL : https://$DOMAIN/balance"
echo "헬스 체크    : curl https://$DOMAIN/balance/health"
echo "Admin 예시   : curl -H 'X-Admin-Key: $BALANCE_ADMIN_KEY' https://$DOMAIN/balance/api/admin/topics"
echo ""
echo "프론트 .env 설정:"
echo "  VITE_API_URL=https://$DOMAIN/balance"
echo "  VITE_APP_NAME=we-balance-game"
echo "========================================"

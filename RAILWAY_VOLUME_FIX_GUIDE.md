# 🚨 Railway Volume 경로 수정 필수 가이드

## 문제 진단 완료 ✅

**핵심 문제**: `RAILWAY_VOLUME_MOUNT_PATH = "C:/Program Files/Git/data"` (Windows 경로)
**해결책**: `/data`로 변경 (Linux 경로)

## ⚠️ 이 문제로 인한 증상

- ✅ 업로드는 성공적으로 완료됨
- ❌ 갤러리에서 이미지/비디오가 0개로 표시됨
- ❌ 파일들이 잘못된 경로에 저장되어 찾을 수 없음

## 🔧 수정 단계 (반드시 필요)

### 1단계: Railway 대시보드 접속
```
https://railway.app/project/[PROJECT_ID]/variables
```

### 2단계: 환경 변수 수정
1. **Variables** 탭 클릭
2. `RAILWAY_VOLUME_MOUNT_PATH` 찾기
3. 현재 값: `C:/Program Files/Git/data`
4. **새 값으로 변경**: `/data`
5. **Save** 클릭

### 3단계: 서비스 재배포
```bash
railway up
```
또는 GitHub에 커밋하여 자동 배포 트리거

### 4단계: 볼륨 마운트 확인
Health Check 호출:
```
https://tk-ai-model-gallery-production-bb9e.up.railway.app/api/health
```

### 5단계: DB-파일 동기화 실행
Admin Panel에서 **Run Sync** 버튼 클릭:
```
https://tk-ai-model-gallery-production-bb9e.up.railway.app/admin/sync
```

## 📊 예상 결과

✅ 볼륨이 `/data`에 정상 마운트됨
✅ 업로드된 파일들이 올바른 경로에 저장됨
✅ 갤러리에서 이미지/비디오 정상 표시됨
✅ DB와 파일시스템 동기화 완료

## 🚀 확인 방법

1. **Admin Panel** → 환경 변수에서 `RAILWAY_VOLUME_MOUNT_PATH: /data` 확인
2. **Directory Status** → Images, Videos 모두 ✅ 표시
3. **갤러리 페이지** → 업로드된 미디어 정상 표시

---

## 💡 추가 정보

- Railway CLI로는 이 환경 변수 변경이 불가능하여 웹 대시보드 사용 필수
- 변경 후 반드시 재배포해야 적용됨
- 기존 업로드된 파일들은 동기화를 통해 복구 가능
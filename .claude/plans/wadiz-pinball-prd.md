# 와디즈 FE팀 핀볼-사다리 마블 룰렛 — PRD

## 1. 프로젝트 개요

와디즈 FE팀 전용 핀볼-사다리(마블 룰렛) 게임.
참가자 이름을 입력하면 물리 시뮬레이션으로 공이 떨어지며 당첨자를 결정한다.
참고: [lazygyu/roulette](https://github.com/lazygyu/roulette)

## 2. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 스타일링 | Tailwind CSS |
| 물리 엔진 | box2d-wasm |
| 렌더링 | HTML5 Canvas 2D |
| 사운드 | Web Audio API |
| 언어 | TypeScript |
| 린팅 | ESLint + Stylelint + Prettier |

## 3. 기능 요구사항

| # | 기능 | 상세 | 인수 조건 |
|---|------|------|----------|
| F1 | 이름 자유 입력 | 쉼표/줄바꿈 구분, 가중치(`/N`), 복제(`*N`) | 이름 파싱 정확, localStorage 저장/복원 |
| F2 | 맵 시스템 | 원본 4맵 포팅 + 와디즈 리스킨 + 오리지널 맵 | 각 맵 로드 후 공 정상 충돌, 맵 전환 동작 |
| F3 | 당첨 모드 3가지 | 첫 번째 도착 / 마지막 도착 / 커스텀 순위 | 모드별 당첨자 정확 결정 |
| F4 | 공 스위칭 | 랜덤 타이밍 + 골 근접 시 역전 드라마 | 두 공의 위치/속도 교환, 시각 이펙트 표시 |
| F5 | 동적 장애물 | 랜덤 타이밍 + 골 근접 시 경로 차단 | 장애물이 물리적으로 충돌, 등장/퇴장 애니메이션 |
| F6 | 빵빠레 효과음 | Web Audio API 팡파레 합성 | 당첨 시 재생, 브라우저 autoplay 정책 준수 |
| F7 | 와디즈 브랜딩 | 헤더 로고+FE팀 문구 + 캔버스 워터마크 | 로고 가시성, 게임 플레이 미방해 |
| F8 | 셔플/시작 | 공 위치 랜덤 셔플, 게임 시작 | 버튼 클릭 시 정상 동작 |
| F9 | 로컬스토리지 | 이름 자동 저장/복원 | 새로고침 후 이름 복원 |

## 4. 비기능 요구사항

| # | 항목 | 상세 |
|---|------|------|
| NF1 | 와디즈 브랜드 디자인 | 디자인 토큰 기반 일관된 스타일 |
| NF2 | 다크모드 | 테마 토글 지원 |
| NF3 | 반응형 | 데스크톱 기준, 모바일 최소 대응, devicePixelRatio 처리 |
| NF4 | 60fps | 물리 시뮬레이션 + 렌더링 성능 |
| NF5 | 에러 처리 | WASM 로드 실패 시 fallback UI |

## 5. 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── GameCanvas.tsx        # Canvas 래퍼 + WASM 로딩 (use client)
│   ├── Header.tsx            # 와디즈 로고 + FE팀
│   ├── NameInput.tsx         # 참가자 이름 입력
│   ├── ControlPanel.tsx      # 셔플/시작/설정 버튼
│   ├── ResultOverlay.tsx     # 당첨 결과 + 파티클
│   ├── MapSelector.tsx       # 맵 선택 드롭다운
│   ├── Minimap.tsx           # 미니맵
│   └── RankDisplay.tsx       # 순위 표시
├── engine/
│   ├── PhysicsWorld.ts       # box2d-wasm 초기화 (싱글턴 캐싱)
│   ├── GameLoop.ts           # rAF + 고정 타임스텝
│   ├── Camera.ts             # 팬/줌/추적
│   ├── Renderer.ts           # Canvas 2D 드로우
│   ├── MarbleManager.ts      # 공 생성/상태/스위칭
│   ├── ObstacleManager.ts    # 동적 장애물 (pendingActions 큐)
│   ├── GoalDetector.ts       # 골 감지 + 순위
│   ├── ParticleSystem.ts     # 파티클 이펙트
│   └── EventBus.ts           # 타입드 이벤트 버스 (mitt 또는 자체 구현)
├── maps/
│   ├── types.ts              # MapData 타입 정의
│   ├── wheelOfFortune.ts
│   ├── bubblePop.ts
│   ├── potOfGreed.ts
│   ├── yoruNiKakeru.ts
│   └── wadizOriginal.ts      # 와디즈 오리지널 맵
├── audio/
│   └── Fanfare.ts            # Web Audio API 팡파레 합성
├── hooks/
│   ├── useLocalStorage.ts
│   └── useGameEngine.ts      # 엔진 lifecycle 관리
├── styles/
│   └── tokens.ts             # 디자인 토큰 (단일 소스)
├── types/
│   └── game.ts               # 공통 타입
└── constants/
    └── brand.ts              # 와디즈 브랜드 상수
```

## 6. 아키텍처 핵심 결정

### 6.1 box2d-wasm + Next.js 통합
- `GameCanvas.tsx`에 `"use client"` 선언
- `useEffect` 내 dynamic import, useRef로 초기화 플래그 관리
- 전역 싱글턴 패턴으로 WASM 인스턴스 캐싱 (HMR/StrictMode 대응)
- Suspense + Error Boundary로 로딩 실패 처리
- `next.config.js`에 `webpack.experiments.asyncWebAssembly = true`

### 6.2 엔진 ↔ React UI 통신
- TypeScript 제네릭 기반 타입드 EventBus (타입 안전, 디버깅 용이)
- 이벤트: `goal:reached`, `game:start`, `game:end`, `marble:switch`, `obstacle:spawn`
- React → 엔진: useRef로 엔진 인스턴스 메서드 호출

### 6.3 공 스위칭 구현
- 물리 바디 파괴/재생성 없이 상태만 교환
- step 완료 후 콜백에서만 실행 (broad-phase 안전)
- 임시 변수로 원자적 swap 처리
- 스위칭 시 시각 이펙트(번개/섬광) + 파티클

### 6.4 동적 장애물 구현
- `pendingActions` 큐로 step 사이에 CreateBody/DestroyBody
- 장애물 타입: 회전 바, 낙하 블록, 팽창 범퍼
- 등장/퇴장 애니메이션 (크기 트윈)

### 6.5 디자인 토큰 단일 소스
- `styles/tokens.ts`에서 JS 객체로 정의
- Tailwind config에서 import하여 `theme.extend` 주입
- Canvas Renderer에서도 동일 객체 import

## 7. 구현 Phase

### Phase 1: 프로젝트 기초
- Next.js + TS + Tailwind 초기화
- ESLint/Stylelint/Prettier 설정
- 디자인 토큰, 타입 정의, 와디즈 브랜드 상수
- **AC:** `npm run dev` 정상 기동, lint 통과

### Phase 2: 물리 엔진 + 캔버스 코어
- box2d-wasm 싱글턴 초기화
- Canvas 렌더링 루프 (60fps rAF + 고정 타임스텝)
- 카메라, 마블 클래스
- 타입드 EventBus
- **AC:** 빈 맵에 공 낙하·충돌 렌더링, 60fps

### Phase 3: 기준 맵 1개 + 맵 인터페이스 확정
- MapData 타입 정의 + 맵 로더
- 기준 맵 1개(Wheel of Fortune) 포팅으로 엔진-맵 인터페이스 검증
- **AC:** 기준 맵에서 공이 장애물과 정상 충돌

### Phase 4: 게임 로직
- 골 감지 + 3가지 당첨 모드
- 셔플 기능
- 공 스위칭 (랜덤 + 골 근접 트리거)
- 동적 장애물 (랜덤 + 골 근접 트리거)
- **AC:** 모드별 당첨자 정확 결정, 스위칭·장애물 발동

### Phase 5: 나머지 맵 확장
- 나머지 3개 원본 맵 포팅 + 와디즈 리스킨
- 와디즈 오리지널 맵 제작
- 맵 선택 UI
- **AC:** 5개 맵 모두 정상 플레이 가능

### Phase 6: UI + 사운드 + 브랜딩
- 이름 입력 + localStorage
- 헤더(와디즈 로고 + FE팀) + 캔버스 워터마크
- 결과 오버레이 + 파티클
- Web Audio API 팡파레
- 다크모드 토글
- 반응형 처리 + ResizeObserver + devicePixelRatio
- **AC:** 전체 플로우 동작, 브랜딩 적용, 사운드 재생

### Phase 7: 통합 · 폴리시
- 에러 바운더리
- 성능 최적화
- 미니맵, 순위 표시
- 최종 린트/빌드 확인

## 8. 의존성 그래프

```
P1 → P2 → P3 → P4 → P5 ↘
                    ↘ P6 → P7
```

## 9. 리스크 대응

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| box2d-wasm StrictMode 이중 초기화 | 상 | useRef 플래그 + 전역 싱글턴 캐싱 |
| SetTransform step 중 호출 시 크래시 | 상 | pendingActions 큐로 step 완료 후 실행 |
| WASM 로드 실패 | 중 | Error Boundary + fallback UI |
| EventBus 타입 오타 무음 실패 | 중 | TypeScript 제네릭 기반 타입드 이벤트 |
| Canvas/Tailwind 디자인 토큰 불일치 | 중 | 단일 소스(JS 객체)에서 양쪽 생성 |
| 6개 맵 포팅 후 인터페이스 변경 | 중 | Phase 3에서 1개 기준 맵으로 인터페이스 확정 후 확장 |

## 10. 디자인 토큰

```typescript
export const tokens = {
  color: {
    primary: "#00C4B3",      // 와디즈 민트
    secondary: "#FF6B35",    // 와디즈 오렌지
    dark: "#1A1A2E",         // 배경 어두운 남색
    surface: "#16213E",      // 카드/패널 배경
    text: "#FFFFFF",
    textSub: "#A0A0B0",
    accent: "#FFD700",       // 당첨 골드
    danger: "#FF4757",       // 경고/리셋
  },
  marble: [
    "#00C4B3", "#FF6B35", "#FFD700", "#FF4757",
    "#7C5CFC", "#00D2FF", "#FF85A2", "#50FA7B",
  ],
} as const;
```

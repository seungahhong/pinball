# 핀볼-사다리 마블 룰렛 — PRD

## 1. 프로젝트 개요

핀볼-사다리(마블 룰렛) 게임.
참가자 이름을 입력하면 물리 시뮬레이션으로 공이 떨어지며 당첨자를 결정한다.
참고: [lazygyu/roulette](https://github.com/lazygyu/roulette)

## 2. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 런타임 | React 19 |
| 스타일링 | Tailwind CSS v4 (PostCSS) |
| 물리 엔진 | box2d-wasm v7 |
| 렌더링 | HTML5 Canvas 2D |
| 사운드 | Web Audio API (Oscillator 합성) |
| 언어 | TypeScript 5 |
| 린팅 | ESLint v9 + Stylelint v17 + Prettier v3 |

## 3. 기능 요구사항

| # | 기능 | 상세 | 인수 조건 |
|---|------|------|----------|
| F1 | 이름 자유 입력 | 쉼표/줄바꿈 구분, 가중치(`/N`), 복제(`*N`) | `parseNames`가 정확히 파싱, 2명 미만 시 에러, localStorage 저장/복원 |
| F2 | 맵 시스템 | 클래식 4맵(`wheelOfFortune`, `bubblePop`, `potOfGreed`, `yoruNiKakeru`) + 커스텀 1맵 | 5개 맵 모두 로드 가능, 맵 전환 시 게임 리셋 |
| F2.1 | 맵 자동 확장 | `extendMapY(map, 2.5)`로 세로 길이 2.5배 확장, 장애물 섹션 복제 | 벽/바닥은 한 번만 유지, 장애물만 반복 배치 |
| F3 | 당첨 모드 3가지 | `first` / `last` / `custom`(N등) | 모드별 당첨자 정확 결정, 'custom'은 순위 입력 |
| F4 | 공 스위칭 | 8초 주기 + 골 근접 시 확률 발동, 시각 식별만 교체(물리바디 유지) | 두 공 이름·색 swap, 시각 알림 표시 |
| F5 | 동적 장애물 | 6초 주기 + 골 근접 시 확률 발동, 회전바·블록·범퍼 | 큐 기반 추가/제거 (`pendingActions`), 등장 애니메이션 |
| F6 | 빵빠레 효과음 | Web Audio API 오실레이터 합성 (별도 라이브러리 X) | 결과/스위칭/장애물/특수효과별 별도 사운드, autoplay 정책 준수 |
| F7 | 결과 오버레이 | 당첨자/순위 표시, 사용자 정의 결과 문구 | 게임 종료 시 표시, 리셋 동작 |
| F8 | 셔플/시작 | 공 위치 랜덤 셔플, 게임 시작 | `ready` 상태에서만 동작 |
| F9 | 로컬스토리지 | 이름 자동 저장/복원 (`pinball_names`) | 새로고침 후 이름 복원 |
| F10 | 다크모드 토글 | 헤더에서 라이트/다크 전환 | 캔버스 배경/색상 토큰 동기화 |
| F11 | 카메라 컨트롤 | 자동 추적(리더) + 수동 휠/드래그(idle/finished) | 게임 중 자동 추적, 게임 외엔 수동 가능 |
| F12 | 미니맵 | 우상단 맵 전체 + 마블 위치 표시 | 60fps 실시간 동기화 |

### F13. 특수 효과 (2/3 지점 자동 발동)

게임 진행 2/3 지점(`SPECIAL_TRIGGER_THRESHOLD = 2/3`)에서 선택된 특수 효과가 자동 발동된다.

| # | 모드 | 효과 |
|---|------|------|
| F13.1 | `mapFlip` (맵 뒤집기) | (a) 산사태 흔들림(0.6s) (b) 물리 일시정지 (c) CSS 180° 회전(1.4s) (d) 회전 중간점에서 장애물 Y축 미러링 (e) 종료 후 하향 충격력으로 재개 |
| F13.2 | `gravityReverse` (중력 거스리기) | (a) 중력 (0, +10) → (0, -15) 반전 (b) 장애물 슬로프/각속도 반전 (c) goalY를 spawnArea 위로 이동(`goalY = max(spawnArea.y - 3, 0)`) (d) 모든 마블에 (-25) 위 방향 임펄스 (e) 보텍스 파티클 + ambient 사운드 |

#### 안전 불변식 (특수 효과 공통)
- **벽/바닥 보존**: `flipObstaclesKeepWalls` / `reverseObstacleDirections`는 양옆 수직벽(`dy > 20`)과 바닥(`dy < 1 && maxVertY > goalY * 0.8`)을 변형하지 않는다.
- **x축 이탈 금지**: 모든 마블의 x좌표는 `[wallLeftX + radius, wallRightX - radius]` 범위 내 유지.
- **GOAL 도달 보장**: 어떤 모드에서도 충분한 시간(또는 추가 임펄스/넛지)을 거치면 모든 마블이 GOAL에 도달.

## 4. 비기능 요구사항

| # | 항목 | 상세 |
|---|------|------|
| NF1 | 일관된 비주얼 | 디자인 토큰 (`src/styles/tokens.ts`) 단일 소스 |
| NF2 | 다크모드 | 토글 지원, 색 토큰의 light/dark 변형 |
| NF3 | 반응형 | 데스크톱 기준, 캔버스는 ResizeObserver + devicePixelRatio 처리 |
| NF4 | 60fps | rAF + 고정 타임스텝(`FIXED_STEP = 1/100`) |
| NF5 | 에러 처리 | WASM 로드 실패 시 fallback 메시지 |
| NF6 | 파티클 상한 | `MAX_PARTICLES = 500`, 보텍스 파티클 무한 누적 방지 |

## 5. 디렉토리 구조 (현행)

```
src/
├── app/
│   ├── layout.tsx           # 메타데이터, 폰트
│   ├── page.tsx             # 루트 페이지(상태 관리, 컴포넌트 합성)
│   └── globals.css          # Tailwind, shake/flip 애니메이션
├── components/
│   ├── GameCanvas.tsx       # 캔버스 + isShaking/isFlipping 클래스 적용
│   ├── Header.tsx           # 로고 + 다크모드 토글
│   ├── NameInput.tsx        # 이름 입력 + parseNames
│   ├── ControlPanel.tsx     # 맵/모드/효과/특수효과 선택
│   └── ResultOverlay.tsx    # 결과 표시
├── engine/
│   ├── PhysicsWorld.ts      # box2d-wasm 싱글턴, body 관리, 중력 변경 API
│   ├── GameLoop.ts          # rAF 루프, 특수효과 트리거(triggerMapFlip / triggerGravityReverse)
│   ├── Camera.ts            # 자동/수동 카메라
│   ├── Renderer.ts          # 캔버스 드로우(엔티티/마블/파티클/미니맵/UI)
│   ├── MarbleManager.ts     # 마블 생성/스위칭/순위
│   ├── ObstacleManager.ts   # 동적 장애물 큐
│   ├── ParticleSystem.ts    # 골 폭발 + gravityReverse 보텍스
│   └── EventBus.ts          # 타입드 이벤트 버스
├── maps/
│   ├── index.ts             # extendMapY, maps 배열 export
│   ├── types.ts             # (사용 안 됨, 호환용)
│   ├── classic/
│   │   ├── wheelOfFortune.ts
│   │   ├── bubblePop.ts
│   │   ├── potOfGreed.ts
│   │   └── yoruNiKakeru.ts
│   └── custom/
│       └── customMap.ts     # 커스텀 오리지널 맵
├── audio/
│   └── Fanfare.ts           # play / playSwitch / playFlip / playGravityReverse + ambientLoop
├── hooks/
│   ├── useLocalStorage.ts
│   └── useGameEngine.ts     # 엔진 lifecycle + 이벤트 → React 상태
├── styles/
│   └── tokens.ts            # 색/마블 팔레트
├── types/
│   └── game.ts              # MapData, MarbleData, GameState, WinMode, SpecialMode 등
└── constants/
    └── brand.ts             # 브랜드/타이틀 상수
```

## 6. 아키텍처 핵심 결정

### 6.1 box2d-wasm + Next.js 통합
- `useGameEngine` 훅 내 `engine.init()`에서 dynamic import로 WASM 로드
- `cachedBox2D` 모듈 변수로 싱글턴 캐시 (StrictMode 이중 호출 안전)
- `initRef` 플래그로 React effect 이중 초기화 방지
- 로드 실패 시 `error` 상태로 fallback UI 표시

### 6.2 엔진 ↔ React UI 통신
- 타입드 EventBus(`gameEvents`): `game:stateChange`, `goal:reached`, `game:finished`, `marble:switch`, `effect:shake`, `effect:mapFlip`, `effect:gravityReverse`
- React 측에서 `gameEvents.on(...)` 구독으로 상태 동기화
- React → 엔진: `engineRef.current?.method()` 직접 호출

### 6.3 공 스위칭 구현
- 물리 바디는 그대로, **이름·색 데이터만 swap** (`MarbleManager.swapRandom`)
- 시각 알림(`Renderer.showSwitchAlert`)으로 두 이름 표시

### 6.4 동적 장애물 구현
- `ObstacleManager.pendingActions` 큐로 step 외부에서 CreateBody/DestroyBody
- 회전바, 낙하 블록, 범퍼 3종

### 6.5 디자인 토큰 단일 소스
- `styles/tokens.ts`에서 JS 객체로 정의, Canvas Renderer/컴포넌트 모두 import

### 6.6 특수 효과 안전성

#### 6.6.1 맵 뒤집기 (`triggerMapFlip`)
1. `physics.pauseMarbles()`로 마블 정지
2. `effect:shake` 이벤트로 0.6s 흔들림
3. 0.7s 후 `effect:mapFlip` → CSS `flip-effect` 애니메이션(1.4s)
4. 회전 중간점(0.7s)에서 `flipObstaclesKeepWalls`로 장애물만 Y축 미러링, 벽/바닥 유지
5. 1.6s 후 `physics.resumeMarbles()` + 하향 임펄스(랜덤 X, +10 Y)로 재개
6. `flipGeneration` + `flipTimers` 큐로 setMap/destroy 시 안전 클린업

#### 6.6.2 중력 거스리기 (`triggerGravityReverse`)
1. `physics.setGravity(0, -15)`로 중력 반전
2. `reverseObstacleDirections`로 폴리라인 정점 Y swap, 박스 angle 반전, 키네매틱 angularVelocity 반전 (벽/바닥은 swap이 아이덴티티)
3. `goalY = max(originalSpawnArea.y - 3, 0)`로 골 위치 위로 이동
4. 모든 마블에 (0, -25) 임펄스
5. `Renderer.directionReversed = true`로 골 방향 표시 반전
6. 보텍스 파티클 + ambient 사운드 시작

#### 6.6.3 양옆 바운더리/x축 이탈 방지
- 양옆 벽은 항상 정점 Y span(`dy > 20`)으로 식별되어 변형 제외
- 모든 맵의 벽 정점은 spawnArea보다 위·goalY보다 아래까지 연장 → 마블 진행 영역 완전 폐쇄
- 맵 뒤집기/중력 거스리기 모두 벽 변형 안 함 (불변식 유지)

#### 6.6.4 GOAL 도달 보장 (정체 방지)
- `MarbleManager.nudgeStuck`: 1.5초간 0.5 단위 이내로 움직이지 않은 마블에 대해 자동 임펄스
- 에스컬레이션: `nudgeCount` 누적 시 `vx = ±(4 + n*2)`, `vy = goal방향 * (3~7 + n*2)` (최대 6단계)
- 마블 위치가 0.5 이상 변동되면 카운터 리셋
- `triggerGravityReverse` 활성 시 nudge 방향이 자동으로 -y(상방)로 전환
- 호출 주기: 500ms (`STUCK_NUDGE_INTERVAL_MS`)

#### 6.6.5 맵 디자인 가드라인 (장애물 간격)
- 인접 원형 장애물(또는 직각 장애물) 사이의 자유 공간(거리 - 반지름 합)은 항상 마블 지름(`2 * 0.5 = 1.0`)보다 커야 함
- 예: `yoruNiKakeru` Level 4의 그라디언트 원 5개는 x 간격 3, 반지름 0.5+i*0.2로 구성하여 모든 인접 쌍의 통과 마진 ≥ 1.0 확보

## 7. 구현 Phase (완료 상태)

| Phase | 상태 | 산출물 |
|-------|------|--------|
| P1 프로젝트 기초 | ✅ | Next.js+TS+Tailwind 초기화, 토큰, 브랜드 상수 |
| P2 물리 엔진 + 캔버스 코어 | ✅ | PhysicsWorld, GameLoop, Renderer, Camera, EventBus |
| P3 기준 맵 + 인터페이스 | ✅ | MapData 타입, wheelOfFortune 검증 |
| P4 게임 로직 | ✅ | 골 감지, 3모드, 셔플, 스위칭, 동적 장애물 |
| P5 맵 확장 | ✅ | classic 4맵 + custom 1맵 + extendMapY |
| P6 UI/사운드/브랜딩 | ✅ | NameInput, ControlPanel, ResultOverlay, Fanfare |
| P7 특수 효과 | ✅ | mapFlip / gravityReverse + 안전 가드 |
| P8 폴리시 | 🟡 | 미니맵 ✅, 카메라 ✅, 에러바운더리 부분 적용 |

## 8. 의존성 그래프

```
P1 → P2 → P3 → P4 → P5 ↘
                    ↘ P6 → P7 → P8
```

## 9. 리스크 대응

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| box2d-wasm StrictMode 이중 초기화 | 상 | useRef 플래그 + 모듈 싱글턴 캐시 |
| SetTransform step 중 호출 시 크래시 | 상 | `pendingActions` 큐로 step 외부에서 실행 |
| WASM 로드 실패 | 중 | `error` 상태 + fallback UI |
| 맵 뒤집기/중력 반전 시 벽 손실 | 상 | 벽 식별(dy>20) + 변형 제외 단위테스트 가치 |
| 마블이 x축 밖으로 이탈 | 상 | 벽 보존 + 임펄스 후 awake + ResumeMarbles 가드 |
| 특수효과 후 GOAL 도달 불가 | 상 | 1) 폴리라인 슬로프 보존, 2) 박스/원 위치만 변형, 3) 임펄스로 정체 해소 |
| 6개 맵 포팅 후 인터페이스 변경 | 중 | MapData 단일 타입으로 통일 |
| 파티클 무한 누적 | 중 | `MAX_PARTICLES = 500` 상한 |

## 10. 디자인 토큰 (현행)

```typescript
export const tokens = {
  color: {
    primary: '#00C4B3',     // 민트 (벽/주요)
    secondary: '#FF6B35',   // 오렌지 (강조/시작)
    dark: '#1A1A2E',        // 다크 배경
    surface: '#16213E',     // 카드/패널
    text: '#FFFFFF',
    textSub: '#A0A0B0',
    accent: '#FFD700',      // 골드 (당첨/바닥)
    danger: '#FF4757',      // 위험 (회전 게이트)
    light: '#F0F0F5',       // 라이트 배경
    lightSurface: '#FFFFFF',
    lightText: '#1A1A2E',
    lightTextSub: '#6B7280',
  },
  marble: [
    /* 16색 팔레트, 인덱스로 순환 */
  ],
} as const;
```

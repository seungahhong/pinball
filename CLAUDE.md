# Pinball Roulette — Claude 작업 가이드

핀볼-사다리(마블 룰렛) 게임. 이름 입력 후 box2d-wasm 기반 물리 시뮬레이션으로 당첨자를 결정한다.
참고 원본: [lazygyu/roulette](https://github.com/lazygyu/roulette).

## 핵심 제약 (반드시 준수)

### 1. Next.js — 학습 데이터와 다름
이 프로젝트는 Next.js **16.x (Turbopack, React 19, App Router)** 사용.
API/관례/파일 구조가 학습 데이터와 다를 수 있음. 코드 작성 전 `node_modules/next/dist/docs/` 의 관련 가이드를 먼저 읽고, deprecation 경고를 따를 것.

### 2. 패키지 매니저는 pnpm
- `package.json`의 `packageManager: pnpm@10.33.0` 고정
- 항상 `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm exec <tool>` 사용
- `npm install` / `yarn` 금지 (lockfile 충돌)

### 3. Tailwind CSS v4 (PostCSS 모드)
- `globals.css` 의 `@import 'tailwindcss';` 는 **string 형태**여야 함 (`url(...)` 금지 — PostCSS plugin이 string만 인식)
- `.stylelintrc.json` 에 `import-notation: "string"` 설정으로 자동 변환 차단

### 4. 게임 안전 불변식 (특수효과 적용 시)
**아래 4가지는 어떤 변경에도 절대 깨뜨리지 말 것**:

| # | 불변식 | 보장 위치 |
|---|--------|----------|
| I1 | 양옆 수직벽(`dy > 20`)은 변형 제외 | `flipObstaclesKeepWalls`, `reverseObstacleDirections` |
| I2 | 바닥(`dy < 1 && maxVertY > goalY*0.8`)은 변형 제외 | 동일 |
| I3 | 마블 x좌표는 `[wallLeftX + r, wallRightX - r]` 범위 내 유지 | 벽 보존 + 임펄스 후 `applyImpulseToMarble` |
| I4 | 모든 마블은 finite 시간 내 GOAL 도달 | `MarbleManager.nudgeStuck` (1.5s 정체 감지 + 에스컬레이션) |

### 5. 맵 디자인 가드라인
- 인접 장애물(원/박스) 간 자유 공간 = `거리 - (반지름 합)` 은 항상 **마블 지름(1.0) 초과**여야 함
- 위반 사례: `yoruNiKakeru` Level 4 — x간격 2 + 반지름 0.8~1.6 → 인접 원 간 0.23 단위 (마블 통과 불가) → x간격 3 + 반지름 0.5~1.3으로 수정됨

## 디렉토리 구조

```
src/
├── app/                  # Next.js App Router
├── components/           # 'use client' 컴포넌트 (NameInput, ControlPanel, ResultOverlay 등)
├── engine/               # 물리/렌더링 코어
│   ├── PhysicsWorld.ts   # box2d-wasm 싱글턴, body 관리, 중력 변경
│   ├── GameLoop.ts       # rAF 루프, 특수효과 트리거
│   ├── MarbleManager.ts  # 마블 lifecycle + nudgeStuck
│   ├── Renderer.ts       # Canvas 2D
│   └── EventBus.ts       # 타입드 이벤트 버스
├── maps/
│   ├── classic/          # 4개 클래식 맵
│   ├── custom/           # 커스텀 맵
│   └── index.ts          # extendMapY (세로 2.5x 확장 + 장애물 섹션 복제)
├── audio/Fanfare.ts      # Web Audio API 오실레이터 합성
├── hooks/
│   ├── useGameEngine.ts  # 엔진 lifecycle (dev 모드에서 window.__gameEngine 노출)
│   └── useLocalStorage.ts
├── styles/tokens.ts      # 디자인 토큰 (Canvas + Tailwind 양쪽에서 import)
├── types/game.ts
└── constants/brand.ts
```

## 작업 시 권장 흐름

1. **명세 확인**: `.claude/plans/pinball-prd.md` (현행 기능)
2. **테스트 케이스 확인**: `.claude/plans/qa-acceptance.md` (TC-10/11이 핵심 안전 인수)
3. **코드 변경 후 검증** (반드시 모두 통과):
   - `pnpm exec eslint src`
   - `pnpm exec stylelint "src/**/*.css"`
   - `pnpm exec prettier --check "src/**/*.{ts,tsx,css,json}"`
   - `pnpm exec tsc --noEmit`
   - `pnpm build`
4. **물리/특수효과 변경 시**: Chrome DevTools MCP로 5맵 × 2특수효과 매트릭스 인수 테스트 (`.claude/plans/qa-acceptance.md` TC-10, TC-11)

## 진단/디버깅

dev 모드에서 `window.__gameEngine.getDiagnostics()` 호출하면:
- `state`, `isGravityReversed`, `isPaused`
- `marbles[].{x, y, finished}`
- `walls[].{side, vertices}` — 좌/우/바닥 벽 식별 결과

이 진단으로 마블 x좌표/벽 보존 여부를 자동 검증 가능.

## 메모/문서 관리
- 프로젝트 명세: `.claude/plans/pinball-prd.md`
- QA 테스트: `.claude/plans/qa-acceptance.md`
- QA 스크린샷: `.claude/qa-screenshots/`

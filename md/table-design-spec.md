# 테이블 디자인 스펙 — 쿠팡정산관리 발주내역 기준

`src/pages/marketing/CoupangSettlementPage.tsx`의 발주내역 탭에 적용된 테이블 디자인을 다른
화면/다른 프로젝트에서도 그대로 재현할 수 있도록 정리한 문서. 지브라, 호버, 다중선택 필터,
정렬, 폰트, 칼럼 좌우 크기조절(+칼럼 순서 드래그변경)까지 전부 포함.

## 미리보기 요약

- 헤더: 연보라 배경(`#EBF1FD`) + sticky
- 본문: 짝/홀 지브라 줄무늬, 마우스 오버 시 하이라이트
- 각 컬럼 헤더에 "라벨 클릭 = 정렬", "▼ 버튼 = 다중선택 필터"가 한 줄에 같이 붙어있음
- 헤더 우측 경계를 드래그하면 칼럼 폭 조절, 헤더 자체를 드래그하면 칼럼 순서 변경 — **기본으로 켜져 있음**(`columnControls` prop 기본값 `true`, 끄려면 명시적으로 `false`를 줘야 함)
- 포인트 컬러(강조색): `#534AB7`

---

## 1. 색상 토큰

| 용도 | 값 |
|---|---|
| 헤더 배경 | `#E3ECFB` (인라인 `style={{ backgroundColor: '#E3ECFB' }}`, sticky top-0) |
| 헤더 텍스트 | `#334155` |
| 테두리(Border) | `#D0DDF3` (표 바깥 테두리 + 헤더 칸 구분선) |
| 지브라 홀수행 | `bg-[#F5F8FF]` |
| 지브라 짝수행 | `bg-white` |
| 호버 | `hover:bg-[#DCE8FA]` + `transition-colors` |
| 강조색(필터 활성/버튼/뱃지) | `#534AB7` |
| 컬럼 리사이즈 핸들 호버 | `hover:bg-violet-300/50 active:bg-violet-400/70` |

상태별로 배경이 이미 다른 행(예: 경고/에러 행)은 지브라 대신 상태색을 쓰되, 호버도 그 톤에 맞춰
한 단계 진하게 깔아준다 — 예: `bg-amber-50 hover:bg-amber-100`, `bg-red-50 hover:bg-red-100`,
`bg-gray-50 hover:bg-gray-100`. 지브라와 상태색을 절대 동시에 쓰지 않는다(상태색이 우선).

## 2. 폰트 / 셀

```
th (라벨) : px-2.5 py-1.5 text-[14px] font-semibold text-[#334155] whitespace-nowrap overflow-hidden text-ellipsis
td (본문) : px-2.5 py-1.5 text-[14px] text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis
숫자 컬럼   : 위 두 개에 text-right 추가 (thNumCls / tdNumCls)
```

## 3. 지브라 + 호버 (행 클래스 헬퍼)

```ts
const rowCls = (idx: number) =>
  (idx % 2 === 0 ? 'bg-white hover:bg-[#DCE8FA]' : 'bg-[#F5F8FF] hover:bg-[#DCE8FA]') + ' transition-colors'
```

```tsx
<tr key={row.id} className={rowCls(idx)}>...</tr>
```

## 4. 다중선택 필터 + 정렬 (컬럼 헤더 컴포넌트)

라벨 클릭 → 정렬 토글(asc → desc → 해제), 라벨 옆 `▼` 버튼 → 체크박스 다중선택 필터 팝업
(전체 선택 + 개별 옵션 + 하단 **적용/초기화** 버튼, 즉시반영 아님·적용 버튼 눌러야 반영되는
draft 방식). `createPortal`로 body에 렌더링해 테이블 `overflow`에 안 잘리게 한다.

```tsx
type SortState = { col: string; dir: 'asc' | 'desc' } | null

function SortIcon({ col, sort }: { col: string; sort: SortState }) {
  if (sort?.col !== col) return <ChevronsUpDown size={12} className="text-gray-300" />
  return sort.dir === 'asc'
    ? <ChevronUp size={12} className="text-[#534AB7]" />
    : <ChevronDown size={12} className="text-[#534AB7]" />
}

const ColFilter: React.FC<{
  label: string; options: string[]; selected: string[]
  onChange: (v: string[]) => void; onSort?: () => void; sort?: SortState; sortCol?: string
}> = ({ label, options, selected, onChange, onSort, sort, sortCol }) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(selected)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, alignRight: false })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!open) setDraft(selected) }, [selected, open])

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const alignRight = r.left + 160 > window.innerWidth
      setMenuPos({ top: r.bottom + 4, left: alignRight ? r.right : r.left, alignRight })
    }
    setDraft(selected)
    setOpen((p) => !p)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (opt: string) => {
    if (opt === '__all__') { setDraft([]); return }
    setDraft((prev) => prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt])
  }
  const apply = () => { onChange(draft); setOpen(false) }
  const reset = () => { setDraft([]); onChange([]); setOpen(false) }

  const isActive = selected.length > 0
  const isAllDraft = draft.length === 0
  const ACC = '#534AB7'

  return (
    <span className="inline-flex items-center gap-0.5 cursor-pointer select-none">
      <span className="whitespace-nowrap" onClick={onSort}>{label}</span>
      {sortCol && <span onClick={onSort}><SortIcon col={sortCol} sort={sort ?? null} /></span>}
      <button ref={triggerRef} onClick={openMenu}
        className="text-[9px] px-0.5 ml-0.5 leading-none transition-colors flex-shrink-0"
        style={{ color: isActive ? ACC : '#d1d5db' }}>▼</button>
      {isActive && (
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold" style={{ backgroundColor: ACC }}>
          {selected.length}
        </span>
      )}
      {open && createPortal(
        <div ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, ...(menuPos.alignRight ? { right: window.innerWidth - menuPos.left } : { left: menuPos.left }), zIndex: 9999, width: 180 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 flex flex-col">
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-md mx-1" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={isAllDraft} onChange={() => toggle('__all__')} className="w-3.5 h-3.5 rounded" style={{ accentColor: ACC }} />
              <span className="text-[13px]" style={{ color: isAllDraft ? ACC : '#374151', fontWeight: isAllDraft ? 600 : 400 }}>전체</span>
            </label>
            <div className="border-t border-gray-100 my-1" />
            {options.length === 0 ? (
              <p className="px-3 py-2 text-[12px] text-gray-400 text-center">값 없음</p>
            ) : options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-md mx-1" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={draft.includes(opt)} onChange={() => toggle(opt)} className="w-3.5 h-3.5 rounded" style={{ accentColor: ACC }} />
                <span className="text-[13px] truncate" style={{ color: draft.includes(opt) ? ACC : '#374151', fontWeight: draft.includes(opt) ? 600 : 400 }}>{opt}</span>
              </label>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-1.5 pt-1.5 px-2 pb-0.5 flex gap-1.5 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); apply() }}
              className="flex-1 py-1 text-[12px] text-white rounded-lg font-medium transition-colors" style={{ backgroundColor: ACC }}>적용</button>
            <button onClick={(e) => { e.stopPropagation(); reset() }}
              className="flex-1 py-1 text-[12px] border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">초기화</button>
          </div>
        </div>, document.body
      )}
    </span>
  )
}
```

사용 시 컬럼 값 목록(`options`)과 현재 선택값(`selected`), 정렬 상태(`sort`)는 부모 컴포넌트가
관리하며 필터/정렬 로직도 부모의 `filter`/`sort` 배열 처리로 적용한다 (이 컴포넌트는 UI+로컬
draft 상태만 담당, 실제 반영은 `onChange`/`onSort` 콜백으로 위임).

## 5. 칼럼 좌우 크기조절 + 순서 드래그변경

**HanwoolCost에서는 이 기능이 기본값(ON)이다.** 공용 `DataTable`(`src/components/table/DataTable.tsx`)의
`columnControls` prop 기본값이 `true`라서, 새 화면에서 `<DataTable ...>`을 쓸 때 **`columnControls`를
아예 안 주면 자동으로 적용**된다. 일부러 `columnControls={false}`를 넣어서 끄는 건, 컬럼 수가
매우 적고 항상 고정적인 표(예: 공휴일관리처럼 필터 컬럼 자체가 몇 개 안 되는 경우)에**만** 예외적으로
쓰는 것이지 기본 선택지가 아니다. 새 화면을 만들 때 다른 화면을 복붙하다가 실수로
`columnControls={false}`가 같이 딸려오지 않았는지 항상 확인한다(2026-08-02에 거래처마스터
화면에서 실제로 이 실수가 있었음).

두 기능이 같은 `<th>`(`DraggableTh`)에 함께 들어간다 — **헤더 몸통을 드래그하면 순서 변경**,
**헤더 우측 끝 1.5px 폭 핸들을 드래그하면 너비 조절**.

```ts
const COL_MIN_W = 50

// 순서 변경
function useColDrag(order: string[], onReorder: (next: string[]) => void) {
  const dragKeyRef = useRef<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  return {
    overKey,
    onDragStart: (key: string) => (e: React.DragEvent) => { dragKeyRef.current = key; e.dataTransfer.effectAllowed = 'move' },
    onDragOver: (key: string) => (e: React.DragEvent) => { e.preventDefault(); if (overKey !== key) setOverKey(key) },
    onDrop: (key: string) => (e: React.DragEvent) => {
      e.preventDefault()
      const from = dragKeyRef.current
      dragKeyRef.current = null; setOverKey(null)
      if (!from || from === key) return
      const next = [...order]
      const fromIdx = next.indexOf(from), toIdx = next.indexOf(key)
      if (fromIdx < 0 || toIdx < 0) return
      next.splice(fromIdx, 1); next.splice(toIdx, 0, from)
      onReorder(next)
    },
    onDragEnd: () => { dragKeyRef.current = null; setOverKey(null) },
  }
}

// 너비 조절 — 헤더 우측 경계를 드래그. 상태는 저장소(zustand 등)의 위젯별 상태로 관리해
// 새로고침해도 유지되게 한다.
function useColResize(widthsKey: string, cols: { key: string; defaultWidth?: number }[], store: any) {
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null)
  const widthOf = (key: string) => {
    const widths = store.getState()[widthsKey] as Record<string, number>
    return widths[key] ?? cols.find((c) => c.key === key)?.defaultWidth ?? 100
  }
  const onMove = (e: MouseEvent) => {
    const r = resizingRef.current
    if (!r) return
    const newW = Math.max(COL_MIN_W, r.startW + (e.clientX - r.startX))
    const current = store.getState()[widthsKey] as Record<string, number>
    store.getState().patch({ [widthsKey]: { ...current, [r.key]: newW } })
  }
  const onUp = () => {
    resizingRef.current = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  const startResize = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = { key, startX: e.clientX, startW: widthOf(key) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  return { widthOf, startResize }
}
```

헤더 셀 컴포넌트:

```tsx
const DraggableTh: React.FC<{
  colKey: string; className: string; drag: ReturnType<typeof useColDrag>; children: React.ReactNode
  onResizeStart?: (e: React.MouseEvent) => void
}> = ({ colKey, className, drag, children, onResizeStart }) => (
  <th
    className={`${className} cursor-move select-none relative ${drag.overKey === colKey ? 'bg-violet-100' : ''}`}
    draggable
    onDragStart={drag.onDragStart(colKey)}
    onDragOver={drag.onDragOver(colKey)}
    onDrop={drag.onDrop(colKey)}
    onDragEnd={drag.onDragEnd}
    title="드래그하여 칼럼 순서 변경">
    {children}
    {onResizeStart && (
      <div
        draggable={false}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e) }}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-violet-300/50 active:bg-violet-400/70 z-20"
      />
    )}
  </th>
)
```

테이블 쪽 적용 — `table-layout: fixed` + `<colgroup>`로 각 컬럼 실제 폭을 지정하고,
테이블 자체는 `minWidth`를 전체 컬럼 폭 합으로 줘서 좁은 화면에선 가로 스크롤이,
넓은 화면에선 `w-full`로 꽉 차게 만든다.

> **⚠️ sticky 칼럼(관리 등)이 있으면 반드시 아래 방식을 따른다.** `border-collapse` +
> `<thead>` 레벨 `sticky top-0`을 쓰면 크로미움에서 **가로 스크롤 중 sticky 칼럼(관리 등)이
> 사라지는 렌더링 버그**가 있다(2026-08-08, 공용 `DataTable` 컴포넌트에서 실제로 발생 — 기타운임(월)
> 화면에서 발견). 대신 `border-separate` + `borderSpacing:0`을 쓰고, `sticky top-0`은 `<thead>`가
> 아니라 **헤더의 th 하나하나에** 개별로 건다(테두리도 `border-collapse` 대신 셀마다
> `border-b border-r`로 직접 그어야 한다 — 자세한 이유와 4가지 규칙은 `sticky_table_pattern`
> 메모리 참고).

```tsx
<div className="border border-[#D0DDF3] rounded-xl overflow-auto" style={{ maxHeight: '65vh' }}>
  <table className="border-separate w-full" style={{ tableLayout: 'fixed', minWidth: colsOrdered.reduce((s, c) => s + widthOf(c.key), 0), borderSpacing: 0 }}>
    <colgroup>
      {colsOrdered.map((c) => <col key={c.key} style={{ width: widthOf(c.key) }} />)}
    </colgroup>
    <thead>
      <tr>
        {colsOrdered.map((c) => (
          <DraggableTh
            key={c.key}
            colKey={c.key}
            className={`${c.numeric ? thNumCls : thCls} sticky top-0 z-20 bg-[#E3ECFB]`}
            drag={colDrag}
            onResizeStart={colResize.startResize(c.key)}
          >
            <ColFilter label={c.label} options={...} selected={...} onChange={...} onSort={...} sort={...} sortCol={c.key} />
          </DraggableTh>
        ))}
      </tr>
    </thead>
    <tbody>{/* rowCls 적용, 우측 고정(sticky right-0) 칼럼이 있으면 z-index를 헤더보다 낮게(z-10) */}</tbody>
  </table>
</div>
```

(`thCls`/`tdCls`는 각 셀에 `border-b border-r border-[#D0DDF3]`를 이미 포함하고 있다 — 표 바깥
테두리만 감싸는 컨테이너 div의 `border`로 처리한다.)

## 6. 화면 높이 꽉 채우기 (fillHeight)

기본은 `maxHeight`(기본값 `65vh`)로 표 높이를 제한하지만, 목록 화면 하나가 전체 화면인 경우
(거래처마스터/자재마스터/제품마스터/UPPH관리/메뉴관리/코드관리의 코드 목록 등) 표 아래에
빈 여백이 남으면 어색하다. 이런 화면은 `DataTable`의 `fillHeight` prop을 켜서 표가 화면
아래쪽 끝까지 자동으로 늘어나게 한다(창 크기를 바꿔도 그만큼 같이 늘고 줄어드는 반응형).

**적용 조건**: 화면 전체가 "제목+툴바+검색줄+표 하나"로 끝나는 목록형 화면일 때 쓴다. 표
아래에 안내 문구나 다른 섹션이 이어지는 화면(예: 공휴일관리의 하단 안내문)은 굳이 안 맞춰도
된다 — 그런 화면은 기존 `maxHeight` 방식을 그대로 유지한다.

**DataTable 쪽**(이미 구현됨, `src/components/table/DataTable.tsx`): `fillHeight`를 켜면
`maxHeight` 대신 `height: 100%`를 쓴다.

```tsx
<div
  className="border border-[#D0DDF3] rounded-xl overflow-auto"
  style={fillHeight ? { height: '100%' } : { maxHeight }}
>
```

**페이지 쪽**: `height: 100%`가 실제로 의미를 가지려면 부모가 진짜 높이를 갖고 있어야 한다.
페이지 최상위를 세로 flex로 만들고, 제목/툴바/검색줄처럼 고정 높이인 요소는
`flex-shrink-0`, 표를 감싸는 div만 `min-h-0 flex-1`로 나머지 공간을 전부 차지하게 한다.

```tsx
<div className="flex h-full flex-col">
  <div className="mb-4 flex-shrink-0">{/* 제목 + 툴바 */}</div>
  <div className="mb-3 flex-shrink-0">{/* 검색/필터 줄 */}</div>
  <div className="min-h-0 flex-1">
    <DataTable ... fillHeight />
  </div>
</div>
```

**좌우 2단 화면(예: 코드관리)일 때**: 표가 있는 오른쪽 패널만 늘리면 왼쪽 패널 안쪽에
새로운 빈 칸이 생긴다(2026-08-03에 코드관리에서 실제로 겪음). 바깥 flex row에
`items-stretch`를 주고, 왼쪽 패널도 `flex flex-col`로 만들어서 그 안의 목록도
`min-h-0 flex-1 overflow-y-auto`로 같이 늘어나게 맞춘다.

```tsx
<div className="flex min-h-0 flex-1 items-stretch gap-4">
  <div className="flex w-72 flex-shrink-0 flex-col rounded-xl border ...">
    {/* 고정 높이 섹션들: flex-shrink-0 */}
    <div className="min-h-0 flex-1 overflow-y-auto">{/* 왼쪽 목록 */}</div>
  </div>
  <div className="flex min-w-0 flex-1 flex-col">
    {/* 헤더 줄: flex-shrink-0 */}
    <div className="min-h-0 flex-1">
      <DataTable ... fillHeight />
    </div>
  </div>
</div>
```

**적용 사례**: 메뉴관리, 거래처마스터, 자재마스터, 제품마스터, UPPH관리, 코드관리(코드 목록 부분).

## 재사용 프롬프트

다른 화면/다른 프로젝트에서 이 디자인을 그대로 적용하고 싶을 때 그대로 붙여넣어 요청:

```
[화면명] 테이블에 쿠팡정산관리(발주내역) 화면과 동일한 디자인 적용해줘.
- 헤더 배경 #E3ECFB(sticky), 헤더 텍스트 #334155, 테두리 #D0DDF3, 지브라(흰색/#F5F8FF), 호버 #DCE8FA + transition-colors
- 상태별 강조 행(경고/에러 등)은 지브라 대신 상태색 유지하되 호버도 그 톤에 맞게 한 단계 진하게
- 헤더 폰트 14px, 굵게(#334155) / 본문 폰트 14px(text-gray-700), 셀 패딩 px-2.5 py-1.5
- 모든 컬럼 헤더에 라벨 클릭 정렬(asc/desc/해제 토글) + ▼ 다중선택 필터(적용/초기화 버튼, 즉시반영 아님)
- 헤더 우측 경계 드래그로 칼럼 폭 조절(WBS 방식), 헤더 자체 드래그로 칼럼 순서 변경 — **이건 기본으로 켠다**(컬럼 수가 아주 적고 고정적인 표가 아닌 이상 끄지 않는다)
- 강조색은 #534AB7 (필터 활성 표시, 적용 버튼, 리사이즈 핸들 호버 등)
- 관리(액션 버튼) 컬럼은 필터/정렬/드래그 제외
- (화면 전체가 이 표 하나뿐이면) 표가 화면 하단까지 꽉 차도록 fillHeight 적용
```

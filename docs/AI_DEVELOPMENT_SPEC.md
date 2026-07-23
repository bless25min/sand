# AI 魔獸領域遠征軍團 RPG

# AI 開發總說明書 v1.0

---

# 0. 文件定位

本文件是專案的主要產品規格與技術規格，提供給 AI 開發代理、工程師、設計者與測試代理共同使用。

本文件定義：

* 遊戲定位
* 核心玩法
* 世界結構
* 沙盤戰鬥
* 自然語言軍令
* 魔獸領域開荒
* 掉落與製造
* 軍團養成
* 隊伍與英雄
* 升級與轉職
* AI 使用邊界
* 前後端技術架構
* Cloudflare 服務分工
* 資料模型
* API 契約
* 測試原則
* MVP 範圍
* 開發順序
* AI 開發工作規則

本文件沒有定義的內容，不得由開發 AI 擅自擴張成大型系統。

若開發中遇到規格衝突，優先順序為：

1. 核心設計原則
2. MVP 完成條件
3. 資料契約
4. 系統模組責任
5. 個別功能描述
6. 實作便利性

---

# 1. 遊戲名稱與產品定位

暫定名稱：

**Project Expedition**

產品定義：

> 一款以自然語言下達軍令、以點陣沙盤呈現大規模戰爭，並結合魔獸領域開荒、裝備掉落、素材製造、軍團養成、隊伍升級、轉職與 Build 組合的戰略角色扮演遊戲。

玩家扮演：

* 遠征軍總指揮
* 王國開拓者
* 軍團統帥

玩家不直接控制每一名士兵。

玩家負責：

* 組建軍團
* 配置裝備
* 決定遠征路線
* 選擇隊伍與將領
* 下達自然語言軍令
* 判斷何時繼續深入
* 判斷何時撤退
* 使用戰利品強化下一次遠征

主要敵人不是其他人類王國，而是未知領域中的：

* 魔獸群落
* 魔獸軍團
* 巨型首領
* 魔獸巢穴
* 異變生態
* 腐化地形
* 古代防衛系統
* 魔力災害
* 被魔化的文明遺跡

---

# 2. 核心遊戲幻想

玩家應該感受到：

> 這不是一支系統預先設定好的軍隊，而是我透過裝備、職業、技能、將領與戰術，親手打造出來的遠征軍。

玩家可以下達：

> 第一重盾團向中央穩步推進，保持盾牆，不追擊潰逃的小型魔獸。獵獸射手沿森林右側繞行，等待角甲獸轉向後集中射擊腹部。騎兵留在後方，不得提早衝鋒。

AI負責理解這道命令。

規則引擎負責判斷：

* 軍令如何執行
* 部隊是否有能力完成
* 途中付出多少代價
* 魔獸如何反應
* 戰場如何變化
* 傷亡與戰利品如何產生

玩家看到的不是抽象數字，而是：

* 重盾團形成密集接觸線
* 射手沿森林邊緣移動
* 角甲獸撞擊方陣
* 方陣局部凹陷
* 騎兵等待突破機會
* 魔獸點群被包圍、分裂與潰散

---

# 3. 核心設計原則

## 3.1 軍令是絕對命令

AI不得擅自把玩家的軍令改成較合理、較安全或較容易完成的版本。

例如玩家下令：

> 重甲軍全速穿越沼澤，不能掉隊，也不能降低戰鬥力。

系統必須保留全部要求。

軍令可能包含物理上互相衝突的目標。

解析器應標記衝突，但不得刪除內容。

戰場規則會證明：

* 哪些要求被完成
* 哪些要求無法兼顧
* 付出什麼代價
* 部隊實際執行到什麼程度

---

## 3.2 AI不決定世界事實

AI不得直接決定：

* 勝負
* 傷亡
* 掉落
* 命中
* 行軍距離
* 是否突破
* 是否潰敗
* 裝備強化結果
* 魔獸是否死亡
* 軍團是否轉職成功
* 世界節點是否被征服

以上結果必須由規則引擎決定。

AI只負責：

* 理解語言
* 轉換資料
* 敘述結果
* 扮演角色
* 提供有資訊限制的建議
* 將結構化事件轉為戰報

---

## 3.3 不模擬每一名士兵的完整AI

畫面上可以有：

* 2,000點
* 10,000點
* 20,000點

但不代表有同樣數量的完整角色物件。

真正模擬的單位為：

* 軍團
* 部隊
* 特殊隊伍
* 英雄
* 魔獸群
* 巨型魔獸
* 局部格網
* 接觸區域
* 戰勢場

畫面中的普通士兵點：

* 不擁有完整AI
* 不獨立尋路
* 不擁有個別裝備欄
* 不使用剛體
* 不使用個別碰撞器
* 不使用個別血量
* 不每幀執行獨立更新

---

## 3.4 規則與渲染完全分離

規則引擎不應知道：

* PixiJS
* React
* Canvas
* DOM
* 顏色
* Sprite
* 特效
* 鏡頭
* LLM

渲染器不應直接修改：

* 傷亡
* 士氣
* 疲勞
* 凝聚
* 掉落
* 戰鬥結果
* 軍團經驗

正確資料流：

```text
玩家操作
↓
結構化軍令
↓
模擬核心
↓
戰場狀態與事件
↓
視覺投影
↓
PixiJS畫面
```

---

## 3.5 所有重要數值都應視覺化

玩家不應只看到：

```text
疲勞 +20
凝聚 -15
士氣 -10
```

畫面需要同步呈現：

| 狀態   | 沙盤表現          |
| ---- | ------------- |
| 兵力下降 | 點數與密度下降       |
| 疲勞上升 | 點群拖尾、停頓、速度不同步 |
| 凝聚下降 | 陣形破洞、裂解、分群    |
| 士氣下降 | 猶豫、方向不一致、後退   |
| 掉隊   | 點逐步脫離主群       |
| 指揮中斷 | 指揮線斷裂         |
| 補給中斷 | 補給路線中斷        |
| 潰敗   | 點群形成明顯逃逸流     |
| 重甲   | 點外框厚重、移動較慢    |
| 輕裝   | 點群較鬆散、轉向較快    |
| 長槍   | 接觸距離增加        |
| 巨獸   | 大型點或大型輪廓推進    |

---

## 3.6 允許亂戰

真正戰爭不應永遠維持整齊方塊。

敵我可以：

* 接觸
* 推擠
* 交錯
* 包圍
* 切斷
* 分裂
* 重新集結
* 局部殲滅
* 形成潰敗後流

目標不是避免混亂。

目標是：

> 呈現玩家能理解、能追蹤、能干預的混亂。

---

## 3.7 Build必須改變沙盤行為

裝備、技能、轉職不得只改變面板數字。

例如：

### 輕量重甲

不只是防禦增加。

還應表現為：

* 點群維持厚重外觀
* 強行軍拖尾減少
* 陣形重整較快
* 補給負擔仍高

### 獵獸長弓

不只是攻擊增加。

還應表現為：

* 對大型魔獸有效射界增加
* 可優先攻擊指定部位
* 對小型高速獸群效率下降

---

# 4. 核心遊戲循環

```text
選擇魔獸領域
↓
偵察未知節點
↓
編組遠征軍
↓
配置職業、技能、裝備與補給
↓
選擇遠征路線
↓
進入沙盤戰場
↓
下達自然語言軍令
↓
取得勝利、撤退或潰敗
↓
回收裝備與素材
↓
決定繼續深入或返回基地
↓
製造、強化、升級、轉職
↓
調整軍團Build
↓
挑戰更深層領域
```

核心循環必須在最早版本完成：

> 戰鬥 → 掉落 → 裝備改變 → 再次戰鬥。

若此循環沒有趣，其他AI敘事、世界事件和多人系統都沒有開發價值。

---

# 5. 遊戲層級

## 5.1 世界層

負責：

* 魔獸領域
* 領域節點
* 路線
* 威脅
* 資源
* 巢穴
* 遺跡
* 據點
* 領域變化

---

## 5.2 遠征層

負責：

* 遠征軍配置
* 隊伍選擇
* 補給
* 遠征路線
* 多場連續戰鬥
* 戰利品攜帶
* 繼續深入
* 正常撤退
* 緊急撤退
* 全軍潰敗

---

## 5.3 軍團管理層

負責：

* 軍團編制
* 兵種
* 職業
* 裝備
* 技能
* 經驗
* 傷兵
* 補員
* 將領
* 戰術模板
* 預備隊

---

## 5.4 特殊隊伍與英雄層

負責：

* 英雄隊伍
* 斥候隊
* 法師隊
* 獵獸隊
* 醫療隊
* 指揮官衛隊
* 個人裝備
* 個人技能
* 人格與台詞

---

## 5.5 沙盤戰鬥層

負責：

* 行軍
* 陣形
* 接敵
* 格網密度
* 局部壓力
* 傷亡
* 士氣
* 疲勞
* 凝聚
* 法術
* 潰敗
* 戰利品位置

---

# 6. 世界與領域

## 6.1 世界由領域組成

範例：

* 灰牙森林
* 腐化濕地
* 燼火峽谷
* 霜骨荒原
* 深淵礦坑
* 浮空遺跡
* 世界樹根域
* 龍眠高原

每個領域擁有：

```typescript
interface DomainDefinition {
  id: string;
  name: string;
  description: string;

  recommendedPower: number;
  terrainTypes: TerrainType[];
  environmentalRules: EnvironmentalRule[];

  monsterFamilies: string[];
  possibleBosses: string[];

  materialTableId: string;
  equipmentTableId: string;

  entryNodeIds: string[];
}
```

---

## 6.2 領域節點狀態

```typescript
type DomainNodeStatus =
  | "UNKNOWN"
  | "SCOUTED"
  | "CONTESTED"
  | "CLEARED"
  | "OCCUPIED"
  | "FORTIFIED"
  | "CORRUPTED"
  | "DEPLETED";
```

節點類型：

```typescript
type DomainNodeType =
  | "ENTRY"
  | "BATTLE"
  | "RESOURCE"
  | "ELITE"
  | "NEST"
  | "RUIN"
  | "CAMP"
  | "EVENT"
  | "BOSS"
  | "EXIT";
```

---

## 6.3 領域環境規則

例如腐化濕地：

* 重甲移動能力下降
* 疲勞累積提高
* 火焰攻擊增強
* 毒抗不足會持續損耗
* 大型魔獸可隱藏於泥水
* 長時間停留增加腐化

環境規則必須實際進入模擬公式。

不得只作為敘事文字。

---

# 7. 遠征系統

## 7.1 一次遠征包含多個節點

範例：

```text
入口
↓
狼群巡邏
↓
森林岔路
├─ 廢棄礦區
│  └─ 角甲獸
└─ 林間道路
   └─ 巨蛛伏擊
↓
臨時營地
↓
灰牙巢穴
↓
灰牙領主
```

戰鬥之間保留：

* 現有兵力
* 傷員
* 疲勞
* 士氣
* 裝備耐久
* 補給
* 魔力
* 已取得戰利品
* 臨時增益
* 臨時負面狀態

---

## 7.2 撤退結果

### 正常撤退

條件：

* 尚未被包圍
* 有可用撤退路線
* 指揮鏈正常

結果：

* 保留大部分戰利品
* 正常帶回傷員
* 部隊有序返回

### 緊急撤退

結果：

* 遺失部分重型素材
* 部分傷員與裝備可能被放棄
* 士氣下降
* 部隊凝聚受損

### 全軍潰敗

結果：

* 只有逃出生還者返回
* 大部分攜帶物遺失
* 部分裝備留在戰場
* 將領可能負傷、失蹤或被俘
* 領域威脅增加

---

# 8. 魔獸設計

魔獸不得只是不同數值的普通士兵。

## 8.1 魔獸行為類型

### 群居型

* 高數量
* 低個體價值
* 包覆速度快
* 依賴群體士氣
* 領袖死亡後容易潰散

### 巨獸型

* 數量少
* 大型視覺單位
* 高推力
* 可撞擊方陣
* 易遭包圍
* 可攻擊特定戰線區域

### 飛行型

* 可越過前線
* 可襲擊弓兵、法師、補給與指揮核心
* 需要遠程或專門防空能力

### 地底型

* 平時只顯示活動痕跡
* 可從部隊內部出現
* 需要偵察、陷阱或地脈感知

### 召喚型

* 持續生成低階單位
* 本體通常位於後方
* 需要突破或遠程精確攻擊

### 首領型

* 多階段
* 改變戰場規則
* 具有可破壞部位
* 需要多支部隊協同
* 掉落核心製造素材

---

## 8.2 魔獸群資料模型

```typescript
interface MonsterGroupState {
  id: string;
  definitionId: string;
  factionId: string;

  troopCount: number;
  initialTroopCount: number;

  position: Vec2;
  direction: Vec2;
  targetPosition?: Vec2;

  morale: number;
  fatigue: number;
  cohesion: number;

  behaviorState: MonsterBehaviorState;
  currentTargetId?: string;

  abilities: AbilityInstance[];
  statusEffects: StatusEffectInstance[];
}
```

巨型魔獸可使用獨立模型：

```typescript
interface BossState {
  id: string;
  definitionId: string;

  position: Vec2;
  facing: Vec2;

  health: number;
  maximumHealth: number;

  phase: number;
  bodyParts: BossBodyPartState[];

  activeAbilities: AbilityInstance[];
  threatTable: ThreatEntry[];

  statusEffects: StatusEffectInstance[];
}
```

---

# 9. 軍團資料模型

```typescript
interface UnitState {
  id: string;
  definitionId: string;
  factionId: string;

  name: string;
  unitType: UnitType;
  classId: string;

  level: number;
  experience: number;

  troopCount: number;
  initialTroopCount: number;
  woundedCount: number;
  routedCount: number;

  position: Vec2;
  direction: Vec2;
  targetPosition?: Vec2;

  morale: number;
  fatigue: number;
  cohesion: number;
  discipline: number;
  commandEfficiency: number;

  attack: number;
  defense: number;
  mobility: number;
  carryingCapacity: number;

  formation: FormationType;
  executionState: UnitExecutionState;

  commanderId?: string;
  equipmentLoadoutId: string;

  skillIds: string[];
  passiveIds: string[];
  statusEffects: StatusEffectInstance[];

  currentOrder?: UnitOrder;
}
```

---

# 10. 沙盤格網模型

MVP建議：

```text
128 × 128 Grid
```

每格保存：

```typescript
interface GridCellState {
  index: number;
  position: Vec2;

  terrain: TerrainType;
  height: number;
  movementCost: number;

  factionDensity: Record<string, number>;
  factionPressure: Record<string, number>;
  factionMorale: Record<string, number>;
  factionCohesion: Record<string, number>;
  factionFlow: Record<string, Vec2>;

  activeUnitIds: string[];
  activeMonsterIds: string[];

  environmentalEffects: string[];
  isActiveContactCell: boolean;
}
```

正式版本若效能不足，可將物件結構改為：

* TypedArray
* Struct of Arrays
* 固定Faction索引
* Web Worker共享資料

MVP不應過早進行此優化。

---

# 11. 戰鬥模擬

## 11.1 更新順序

```text
接收已驗證軍令
↓
更新移動與路徑
↓
投影部隊密度
↓
偵測接觸區
↓
計算局部壓力
↓
計算傷亡
↓
更新疲勞
↓
更新凝聚
↓
更新士氣
↓
判斷裂解、撤退與潰敗
↓
產生事件
↓
更新視覺投影資料
```

---

## 11.2 有效戰力

概念公式：

```text
有效戰力
=
局部兵力
× 攻擊或防禦
× 士氣修正
× 凝聚修正
× 疲勞修正
× 陣形修正
× 地形修正
× 裝備修正
× 方向修正
× 指揮修正
× 小幅隨機值
```

一般隨機範圍建議：

```text
0.90～1.10
```

不得用單一大型隨機骰決定整支軍團存亡。

---

## 11.3 局部壓力

```typescript
interface ContactZone {
  id: string;
  cellIndices: number[];

  attackingFactionId: string;
  defendingFactionId: string;

  attackingUnitIds: string[];
  defendingUnitIds: string[];

  contactNormal: Vec2;
  width: number;

  attackingPressure: number;
  defendingPressure: number;

  contactType:
    | "FRONTAL"
    | "FLANK"
    | "REAR"
    | "RANGED"
    | "CHARGE"
    | "ENCIRCLEMENT";
}
```

局部壓力差產生：

* 接觸線位移
* 陣形凹陷
* 部隊後退
* 局部裂口
* 凝聚下降
* 士氣變化

---

## 11.4 疲勞

疲勞來源：

* 普通移動
* 強行軍
* 重型裝備
* 泥濘與山地
* 持續近戰
* 反覆轉向
* 重整陣形
* 魔法消耗
* 補給不足

疲勞影響：

* 移動速度
* 攻擊效率
* 防禦效率
* 凝聚恢復
* 軍令執行品質
* 掉隊機率

---

## 11.5 凝聚

凝聚表示部隊是否仍能作為一個共同組織行動。

凝聚受到：

* 陣形完整
* 指揮鏈
* 地形阻隔
* 側翼攻擊
* 疲勞
* 頻繁改令
* 部隊重疊
* 道路堵塞
* 巨獸衝擊

凝聚過低時：

* 部隊分裂
* 命令影響降低
* 無法快速變換陣形
* 士氣更容易崩潰
* 小群開始優先逃生

---

## 11.6 士氣

士氣受到：

* 傷亡
* 首領威壓
* 側翼受擊
* 後方受擊
* 友軍潰敗
* 指揮官負傷
* 成功突破
* 援軍抵達
* 包圍
* 補給中斷

狀態：

```typescript
type MoraleState =
  | "STEADY"
  | "SHAKEN"
  | "WAVERING"
  | "BREAKING"
  | "ROUTING";
```

---

## 11.7 守恆

任何時候必須符合：

```text
初始兵力
=
現役兵力
+ 傷員
+ 戰死
+ 潰逃
+ 失蹤
+ 俘虜
```

視覺點數、縮放或LOD不得改變真實兵力。

---

# 12. 陣形系統

MVP陣形：

```typescript
type FormationType =
  | "DENSE_BLOCK"
  | "LINE"
  | "COLUMN"
  | "LOOSE"
  | "SQUARE"
  | "WEDGE";
```

## Dense Block

* 高正面密度
* 高凝聚
* 轉向慢
* 適合重步兵

## Line

* 正面寬
* 容易包覆
* 中央較薄

## Column

* 行軍效率高
* 狹窄地形方便
* 接敵前需展開

## Loose

* 地形適應高
* 適合射手與斥候
* 正面抗壓低

## Square

* 抗騎兵與包圍
* 移動慢
* 易遭遠程壓制

## Wedge

* 衝擊集中
* 適合騎兵與突擊部隊
* 失速後側翼脆弱

---

# 13. 自然語言軍令

## 13.1 AI輸入

AI軍令解析器接收：

* 玩家原始文字
* 可見部隊
* 可見魔獸
* 可見地圖區域
* 已知地點
* 合法Action
* 合法Formation
* 合法Constraint
* 軍隊缺省規則
* JSON Schema

---

## 13.2 軍令資料模型

```typescript
interface UnitOrder {
  orderId: string;
  sourceText: string;

  unitIds: string[];

  action: UnitAction;

  target?: OrderTarget;
  direction?: Vec2;

  intensity: number;
  formation?: FormationType;

  priorities: {
    speed: number;
    cohesion: number;
    casualtyAvoidance: number;
    equipmentPreservation: number;
    combatReadiness: number;
  };

  constraints: OrderConstraint[];
  triggers: OrderTrigger[];
  fallbacks: OrderFallback[];

  ambiguities: string[];
  internalConflicts: string[];

  createdAtTick: number;
}
```

---

## 13.3 Action

```typescript
type UnitAction =
  | "ADVANCE"
  | "FORCED_ADVANCE"
  | "HOLD"
  | "DEFEND_AREA"
  | "ATTACK_TARGET"
  | "BREAKTHROUGH"
  | "FLANK"
  | "ESCORT"
  | "RETREAT"
  | "DISENGAGE"
  | "RANGED_SUPPRESS"
  | "AMBUSH"
  | "SCOUT"
  | "CHANGE_FORMATION"
  | "RESERVE"
  | "INTERCEPT"
  | "RECOVER_LOOT";
```

---

## 13.4 約束

```typescript
type OrderConstraintType =
  | "NO_RETREAT"
  | "NO_PURSUIT"
  | "DO_NOT_CROSS_LINE"
  | "PRESERVE_FORMATION"
  | "PROTECT_UNIT"
  | "AVOID_AREA"
  | "HOLD_TARGET"
  | "IGNORE_CASUALTIES"
  | "AVOID_FRIENDLY_FIRE"
  | "ALLOW_FRIENDLY_FIRE"
  | "PRESERVE_LOOT"
  | "PROTECT_COMMANDER";
```

---

## 13.5 AI不得做的事

軍令解析AI不得：

* 補寫玩家沒有指定的重大戰略意圖
* 刪除矛盾要求
* 拒絕戰術上不合理的命令
* 生成傷亡
* 生成掉落
* 修改部隊狀態
* 替玩家決定撤退
* 直接呼叫模擬內部修改方法

---

## 13.6 固定UI備援

即使AI服務不可用，遊戲仍必須可透過固定介面下達：

* 推進
* 強行軍
* 固守
* 攻擊
* 撤退
* 變換陣形
* 遠程壓制
* 側翼移動

AI不是遊戲可運作的必要依賴。

AI是提升自由度與沉浸感的介面。

---

# 14. 掉落系統

## 14.1 掉落類型

```typescript
type LootType =
  | "MATERIAL"
  | "EQUIPMENT"
  | "BLUEPRINT"
  | "CONSUMABLE"
  | "QUEST_ITEM"
  | "BOSS_CORE";
```

素材包括：

* 礦石
* 木材
* 皮
* 骨
* 爪
* 牙
* 結晶
* 魔力液
* 魔獸器官
* 首領核心
* 古代合金

---

## 14.2 掉落生成

```text
掉落基底
+
品質
+
領域來源
+
怪物來源
+
詞綴
+
特殊效果
```

品質：

```typescript
type ItemRarity =
  | "COMMON"
  | "FINE"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "MUTATED";
```

---

## 14.3 戰場回收

掉落可以存在於戰場位置。

玩家可能需要：

* 回收隊
* 運輸隊
* 護衛隊
* 戰後控制區

未回收物品可能因撤退而遺失。

首領屍體也可以成為：

* 地形障礙
* 掩體
* 採集來源
* 魔獸吸引物

---

# 15. 裝備系統

## 15.1 三種裝備尺度

### 個人裝備

使用者：

* 英雄
* 將領
* 特殊角色

### 隊伍裝備

使用者：

* 法師隊
* 斥候隊
* 獵人隊
* 醫療隊
* 工兵隊

### 軍團裝備

作用於整支部隊：

* 制式護甲
* 長槍
* 盾牌
* 軍旗
* 行軍裝具
* 補給車
* 魔抗護符
* 攻城器材

---

## 15.2 裝備取捨

所有裝備至少包含：

```typescript
interface EquipmentDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;

  weight: number;
  defense: number;
  attack: number;
  mobilityModifier: number;
  fatigueModifier: number;
  supplyModifier: number;
  deploymentModifier: number;

  terrainModifiers: Partial<Record<TerrainType, number>>;
  tags: string[];
}
```

更強裝備不得在所有情境中都更好。

例如重甲：

* 正面防禦高
* 衝擊抗性高
* 重量高
* 疲勞快
* 沼澤不利
* 補給成本高

---

# 16. 製造與強化

## 16.1 製造流程

```text
取得圖紙
↓
準備基礎素材
↓
選擇裝備基底
↓
加入特殊素材
↓
選擇製造方向
↓
產生裝備
↓
鑑定詞綴
↓
保留、改造或拆解
```

---

## 16.2 強化方式

* 強化等級
* 詞綴重鑄
* 品質提升
* 核心嵌入
* 領域附魔
* 重量改造
* 裝備改型
* 套裝進化

範例：

### 重盾輕量化

* 重量下降
* 強行軍效率提高
* 防禦略降

### 重盾增厚

* 防禦提高
* 推進抗性提高
* 轉向與部署變慢

---

# 17. 軍團升級與轉職

## 17.1 經驗來源

* 參與戰鬥
* 完成軍令
* 成功維持陣形
* 保護友軍
* 擊敗特定魔獸
* 完成突破
* 從潰敗中生還
* 開荒未知節點

---

## 17.2 基礎職業

* 民兵
* 步兵
* 弓兵
* 騎兵
* 工兵
* 法師兵
* 聖職兵
* 獵獸兵

---

## 17.3 轉職範例

```text
步兵
├─ 重盾衛隊
├─ 長槍方陣
├─ 狂戰軍
├─ 魔抗步兵
└─ 山地步兵
```

```text
弓兵
├─ 長弓軍
├─ 重弩軍
├─ 游擊射手
├─ 魔導砲兵
└─ 獵龍射手
```

```text
騎兵
├─ 重裝騎士
├─ 遊騎兵
├─ 魔獸騎兵
├─ 龍騎兵
└─ 突擊槍騎
```

---

## 17.4 轉職條件

可能包括：

* 等級
* 指定屬性
* 指定戰績
* 圖紙
* 訓練手冊
* 特殊素材
* 指定裝備
* 建築
* 導師
* 領域進度

轉職必須帶來取捨。

不得只是完全上位替代。

---

# 18. 技能

技能類型：

```typescript
type SkillType =
  | "PASSIVE"
  | "TACTICAL"
  | "REACTION"
  | "COMMAND"
  | "FIELD";
```

## 被動技能

* 重甲適應
* 強行軍訓練
* 山地行軍
* 抗恐懼
* 獵獸知識
* 陣形恢復

## 戰術技能

* 盾牆推進
* 槍陣迎擊
* 齊射
* 火力覆蓋
* 強制突破
* 假退誘敵
* 緊急重整

## 反應技能

* 遭騎兵衝擊時建立槍陣
* 士氣瀕臨崩潰時重整
* 首領突入時保護指揮核心
* 飛行魔獸靠近時優先對空

---

# 19. 將領與人格

每名將領擁有：

```typescript
interface CommanderState {
  id: string;
  name: string;

  classId: string;
  level: number;

  strength: number;
  vitality: number;
  dexterity: number;
  agility: number;
  magic: number;

  personalityId: string;
  faithId?: string;

  commandSkills: string[];
  equipmentLoadoutId: string;

  loyalty: number;
  injuries: StatusEffectInstance[];
}
```

人格影響：

* 台詞
* 戰報語氣
* AI建議
* 士氣互動
* 對風險的看法
* 命令回報方式

人格不得偷偷改變玩家命令。

---

# 20. 視覺渲染

## 20.1 技術

戰場使用：

* PixiJS
* WebGL優先
* 未來視需要升級WebGPU
* React不渲染普通士兵點

React負責：

* 軍團管理
* 裝備
* 製造
* 轉職
* 戰報
* 軍令輸入
* 世界地圖
* 遠征介面

PixiJS負責：

* 沙盤地圖
* 地形
* 點群
* 巨獸
* 接觸線
* 軍令箭頭
* 掉落位置
* 戰鬥特效

---

## 20.2 視覺點

```typescript
interface VisualPoint {
  id: number;

  unitId: string;
  factionId: string;

  position: Vec2;
  targetPosition: Vec2;

  rotation: number;
  scale: number;

  shape: PointShape;
  state: PointState;

  animationSeed: number;
}
```

點不得保存：

* 真實HP
* 裝備
* AI
* 尋路狀態
* 技能冷卻
* 戰鬥決策

---

## 20.3 點移動

```text
目標速度
=
陣形吸引
+ 部隊移動
+ 局部壓力
+ 簡單分離
+ 視覺微動
+ 潰敗流場
```

簡單分離只負責避免完全疊在同一像素。

不得用點碰撞決定戰鬥結果。

---

## 20.4 LOD

### 遠距離

* 使用部隊輪廓
* 降低點數
* 顯示方向與密度

### 中距離

* 顯示主要點群
* 顯示裂解與接觸線

### 近距離

* 顯示較多點
* 顯示傷亡、亂戰與巨獸互動

LOD不得改變模擬結果。

---

# 21. 技術架構

## 21.1 技術棧

前端：

* TypeScript
* React
* Vite
* PixiJS
* Zustand或純Store
* Zod

測試：

* Vitest
* Playwright

後端：

* Cloudflare Workers
* Hono或原生Worker Router
* Workers AI
* AI Gateway
* D1
* R2
* Durable Objects
* Agents SDK視需求使用

開發：

* pnpm workspace
* Wrangler
* ESLint
* Prettier
* TypeScript strict mode

---

## 21.2 Monorepo

```text
/apps
  /web
    React遊戲客戶端

  /worker-api
    HTTP API與Workers AI

/packages
  /simulation-core
    純TypeScript戰鬥引擎

  /game-data
    魔獸、裝備、職業、領域資料

  /command-schema
    軍令Schema與驗證

  /progression-core
    掉落、製造、升級與轉職

  /pixi-renderer
    沙盤視覺投影

  /shared-types
    共用型別

  /test-fixtures
    固定戰場與測試資料

/docs
  AI_DEVELOPMENT_SPEC.md
  ARCHITECTURE.md
  DATA_CONTRACTS.md
  TESTING.md
  CONTENT_GUIDE.md
```

---

# 22. Cloudflare服務分工

## 22.1 Workers

負責：

* API入口
* 驗證請求
* 玩家存檔操作
* 遠征請求
* 軍令解析請求
* AI戰報請求
* 資源與設定讀取

---

## 22.2 Workers AI

MVP用途：

* 自然語言軍令解析
* 軍令JSON修復
* 戰報生成
* 將領回報
* 領域敘事

模型必須透過Adapter呼叫。

不得在遊戲邏輯中直接寫死模型名稱。

```typescript
interface LanguageModelAdapter {
  parseOrder(input: ParseOrderInput): Promise<UnitOrder>;
  generateBattleReport(
    input: BattleReportInput
  ): Promise<BattleReportOutput>;
}
```

如此可替換：

* Workers AI模型
* 其他API模型
* 本機模型
* 測試假模型

---

## 22.3 Durable Objects

第一版不應為每隻魔獸建立一個Durable Object。

合理用途：

* 一個多人戰場房間
* 一個持續存在的世界實例
* 一個玩家遠征Session
* 即時多人連線狀態
* WebSocket同步

單機MVP可以暫時不使用Durable Objects。

若使用Agents SDK，可讓一個持久Agent維持會話或世界狀態，並透過HTTP或WebSocket與客戶端通訊；但遊戲規則仍應位於純模擬核心，不應寫進Agent類別。

---

## 22.4 D1

保存：

* 玩家帳號
* 軍團
* 裝備
* 素材
* 領域進度
* 製造紀錄
* 遠征摘要
* 設定

不保存每一個視覺點。

---

## 22.5 R2

保存：

* 大型靜態資料
* 戰鬥重播檔
* 匯出存檔
* 圖像與音效
* 大型內容包
* 開發期戰場快照

---

## 22.6 AI Gateway

用途：

* AI請求紀錄
* 成本監控
* 模型切換
* 錯誤追蹤
* 快取策略
* 供應商備援

---

# 23. 執行位置

## 23.1 戰鬥模擬優先在客戶端執行

單機MVP：

```text
瀏覽器
├─ simulation-core
├─ progression-core
├─ pixi-renderer
└─ React UI
```

優點：

* 即時
* 不產生高頻後端費用
* 離線可測試
* 開發快
* 容易重播
* 不受網路延遲影響

後端只負責：

* 存檔
* AI解析
* 帳號
* 雲端資料
* 遠征摘要

---

## 23.2 多人或防作弊版本

未來才改為：

* 伺服器權威模擬
* Durable Object戰場房間
* 客戶端接收狀態
* 戰場事件透過WebSocket同步

MVP不得提前承擔這個複雜度。

---

# 24. API設計

## 24.1 軍令解析

```text
POST /api/ai/orders/parse
```

Request：

```json
{
  "sourceText": "第一重盾團穩步推進，不得追擊。",
  "battleContext": {
    "visibleUnitIds": ["unit_heavy_01"],
    "visibleTargetIds": ["monster_wolf_01"],
    "visibleLocationIds": ["north_road"]
  }
}
```

Response：

```json
{
  "order": {
    "orderId": "order_001",
    "sourceText": "第一重盾團穩步推進，不得追擊。",
    "unitIds": ["unit_heavy_01"],
    "action": "ADVANCE",
    "intensity": 0.45,
    "priorities": {
      "speed": 0.45,
      "cohesion": 0.9,
      "casualtyAvoidance": 0.8,
      "equipmentPreservation": 0.8,
      "combatReadiness": 0.9
    },
    "constraints": [
      {
        "type": "NO_PURSUIT"
      }
    ],
    "triggers": [],
    "fallbacks": [],
    "ambiguities": [],
    "internalConflicts": [],
    "createdAtTick": 0
  }
}
```

---

## 24.2 戰報生成

```text
POST /api/ai/reports/battle
```

輸入必須是結構化事件。

不得把完整遊戲狀態任意交給模型要求其猜測結果。

---

## 24.3 存檔

```text
GET  /api/save
PUT  /api/save
POST /api/save/checkpoint
```

存檔需包含：

* schemaVersion
* gameVersion
* seed
* playerState
* worldState
* armyState
* inventory
* domainProgress

---

# 25. 決定性與重播

相同：

* 初始狀態
* 軍令
* 隨機種子
* 遊戲版本
* 規則版本

必須產生相同結果。

隨機不得直接使用：

```typescript
Math.random();
```

必須使用可注入的隨機產生器：

```typescript
interface RandomSource {
  next(): number;
  nextInt(min: number, max: number): number;
}
```

重播資料至少包含：

```typescript
interface BattleReplay {
  version: string;
  seed: string;
  initialState: BattleState;
  issuedOrders: TimedOrder[];
  checkpoints?: BattleCheckpoint[];
}
```

---

# 26. 戰鬥事件

所有重大結果必須產生事件。

```typescript
interface BattleEvent {
  id: string;
  tick: number;

  type: BattleEventType;

  sourceIds: string[];
  targetIds: string[];

  position?: Vec2;

  causes: string[];
  effects: Record<string, number | string | boolean>;

  visibility: "PUBLIC" | "PLAYER" | "HIDDEN";
}
```

事件用途：

* 戰報
* 除錯
* 重播
* 玩家查詢原因
* 經驗計算
* 掉落判定
* 任務判定

---

# 27. AI開發規則

所有AI開發代理必須遵守：

## 27.1 實作前

必須先：

1. 閱讀本文件。
2. 確認要修改的模組。
3. 確認模組輸入輸出。
4. 檢查是否違反系統邊界。
5. 列出測試案例。
6. 再開始寫程式。

---

## 27.2 每個任務輸出

AI完成任務時必須提供：

* 修改摘要
* 修改檔案
* 新增型別
* 新增或變更的資料契約
* 測試
* 測試結果
* 未完成項目
* 已知風險

---

## 27.3 禁止事項

不得：

1. 將模擬核心寫進React元件。
2. 將戰鬥結果寫進PixiJS物件。
3. 讓LLM直接修改BattleState。
4. 使用Math.random。
5. 在模擬核心呼叫HTTP。
6. 為普通士兵建立React元素。
7. 為普通士兵建立獨立AI。
8. 為普通士兵建立剛體與碰撞器。
9. 未加測試即修改核心公式。
10. 為方便實作刪除軍令矛盾。
11. 將模型名稱寫死在核心邏輯。
12. 在第一版加入多人同步。
13. 在第一版建立完整動態生態模擬。
14. 以視覺點數當作真實兵力。
15. 因鏡頭縮放改變遊戲結果。

---

# 28. MVP內容

## 28.1 領域

只實作：

**灰牙森林**

---

## 28.2 路線

三條可選區域：

* 林間道路
* 溪谷
* 廢棄礦區

---

## 28.3 魔獸

* 灰牙狼群
* 森林巨蛛
* 角甲獸
* 腐化樹人
* 灰牙領主

---

## 28.4 玩家部隊

* 重步兵
* 弓兵
* 騎兵
* 英雄小隊

---

## 28.5 戰鬥

* 狼群包圍
* 巨蛛伏擊
* 角甲獸衝擊
* 灰牙領主首領戰

---

## 28.6 掉落

* 狼皮
* 魔獸牙
* 巨蛛絲
* 角甲
* 森林結晶
* 灰牙核心

---

## 28.7 製造

* 灰牙披風
* 巨蛛弓弦
* 角甲重盾
* 森林護符

---

## 28.8 轉職

* 步兵 → 重盾衛隊
* 弓兵 → 獵獸射手

---

## 28.9 軍令

* 推進
* 強行軍
* 固守
* 攻擊
* 撤退
* 側翼
* 遠程壓制
* 變換陣形
* 回收戰利品

---

# 29. MVP完成條件

MVP必須完整完成以下循環：

1. 玩家進入灰牙森林。
2. 玩家選擇遠征路線。
3. 玩家配置四支部隊。
4. 玩家可用固定UI下令。
5. 玩家可用自然語言下令。
6. 部隊可移動、接敵、傷亡、裂解與潰敗。
7. 魔獸具有不同沙盤行為。
8. 戰鬥結束產生掉落。
9. 玩家可回收素材。
10. 玩家可撤回基地。
11. 玩家可製造至少一件軍團裝備。
12. 裝備會改變下一場戰鬥的實際表現。
13. 軍團會取得經驗。
14. 至少一支軍團可以轉職。
15. 玩家可重新進入更高難度戰鬥。
16. 所有重大結果可透過事件追溯。
17. 相同Seed可重播相同結果。
18. AI服務失效時，固定UI仍可完成遊戲循環。

---

# 30. 效能目標

第一階段：

* 2,000視覺點
* 穩定60 FPS
* 雙方各2～4支部隊
* 128×128格網

第二階段：

* 10,000視覺點
* 一般桌機穩定60 FPS
* 戰鬥邏輯獨立於渲染

第三階段：

* 20,000視覺點
* 最低可接受30 FPS
* 視需要導入Web Worker
* 視需要改為TypedArray
* 視需要使用自訂GPU批次渲染

禁止一開始就為20,000點重寫整套架構。

---

# 31. 開發階段

## Phase 0：專案骨架

完成：

* pnpm monorepo
* TypeScript strict
* Vite
* React
* PixiJS
* Vitest
* Playwright
* Workers
* Wrangler
* 共用型別

驗收：

* 前端可啟動
* Worker可本機啟動
* 測試可執行
* CI可檢查型別與測試

---

## Phase 1：純模擬戰鬥

完成：

* BattleState
* UnitState
* Grid
* Seeded RNG
* 移動
* 接觸
* 傷亡
* 士氣
* 疲勞
* 凝聚
* 潰敗

沒有畫面也能測試。

---

## Phase 2：PixiJS沙盤

完成：

* 地圖
* 點群
* 方陣
* 移動
* 接觸線
* 傷亡淡出
* 潰敗流
* 點選部隊
* Debug Overlay

---

## Phase 3：魔獸

完成：

* 狼群
* 巨蛛
* 角甲獸
* 腐化樹人
* 首領

重點是不同沙盤行為。

不是先製作美術。

---

## Phase 4：最小遊戲循環

完成：

* 戰鬥結算
* 掉落
* 回收
* 背包
* 製造
* 裝備
* 再戰鬥

這是第一個真正可玩版本。

---

## Phase 5：軍團成長

完成：

* 經驗
* 等級
* 技能
* 轉職
* 傷兵
* 補員

---

## Phase 6：遠征

完成：

* 領域節點
* 路線
* 多場連戰
* 補給
* 繼續或撤退
* 臨時營地

---

## Phase 7：AI軍令

完成：

* Workers AI Adapter
* JSON Schema
* 解析
* 修復
* 預覽
* 固定UI等價輸出
* AI失敗備援

---

## Phase 8：AI敘事

完成：

* 將領回報
* 戰報
* 領域事件敘事
* 人格台詞

只能使用規則引擎已生成的事實。

---

# 32. 第一批開發工作票

## TASK-001：建立Monorepo

輸出：

* apps/web
* apps/worker-api
* packages/shared-types
* packages/simulation-core
* packages/game-data
* packages/command-schema
* packages/pixi-renderer
* packages/progression-core

驗收：

* pnpm install
* pnpm dev
* pnpm test
* pnpm typecheck

全部成功。

---

## TASK-002：建立Seeded RNG

需求：

* 不使用Math.random
* 可輸入Seed
* 同Seed輸出一致
* 提供next與nextInt

測試：

* 同Seed100次結果一致
* 不同Seed結果不同
* 範圍正確

---

## TASK-003：建立BattleState

需求：

* 部隊
* 魔獸
* 格網
* 事件
* Tick
* Seed

不得包含：

* PixiJS
* React
* HTTP
* AI模型

---

## TASK-004：建立移動與方陣

需求：

* 部隊移動
* Dense Block
* Line
* Column
* 目標位置
* 疲勞影響

測試：

* 正常移動
* 強行軍
* 重甲與輕裝差異

---

## TASK-005：建立格網投影

需求：

* 128×128
* 部隊密度
* 魔獸密度
* 流向
* 地形成本

測試：

* 移動後密度更新
* 多部隊可重疊
* 總密度與兵力守恆

---

## TASK-006：建立接觸與傷亡

需求：

* 接觸區
* 局部壓力
* 傷亡
* 戰線位移
* 事件輸出

測試：

* 同質方陣僵持
* 優勢方推進
* 側翼攻擊更有效
* 無瞬間全滅

---

## TASK-007：PixiJS點群

需求：

* 2,000點
* 部隊顏色與形狀
* 插值移動
* 陣形
* 傷亡淡出
* 潰敗流

不得：

* 每點React
* 每點事件監聽
* 每點碰撞器

---

## TASK-008：第一種魔獸

實作：

灰牙狼群。

特性：

* 鬆散群體
* 快速包覆
* 首領依賴
* 低凝聚
* 領袖死亡後士氣下降

---

## TASK-009：掉落與背包

需求：

* 狼皮
* 魔獸牙
* 掉落位置
* 戰後回收
* 背包
* 撤退遺失

---

## TASK-010：角甲重盾

需求：

* 使用狼皮、魔獸牙與角甲製造
* 裝備於重步兵
* 提高正面防禦
* 提高重量
* 降低移動
* 改變點群外觀

此任務完成後，第一次驗證：

> 掉落是否能實際改變下一場戰鬥。

---

# 33. 最終開發判斷標準

每個功能都要回答：

1. 它是否強化核心循環？
2. 它是否能在沙盤上被看見？
3. 它是否由規則引擎決定？
4. 它是否能被測試？
5. 它是否能被重播？
6. AI失效時遊戲是否仍能運作？
7. 是否真的需要現在開發？

若第七題答案是否定，延後到MVP完成後。

---

# 34. 最終產品核心

本遊戲不是：

* 純AI聊天室
* 純戰爭模擬器
* 傳統逐角色RTS
* 單純數值養成遊戲
* 只看自動戰鬥的放置遊戲

它是：

> 玩家建立並培養自己的遠征軍，透過裝備、職業、技能、將領與戰術形成獨特Build，再以自然語言軍令指揮大型沙盤戰鬥，開荒未知魔獸領域，取得下一次成長所需的戰利品。

最重要的四個支柱：

```text
自由軍令
+
可理解的大型沙盤戰爭
+
高取捨的軍團Build
+
開荒、掉落與再挑戰循環
```

任何後續功能都必須服務這四個支柱。

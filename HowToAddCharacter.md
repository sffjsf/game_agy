# 教程：如何在游戏中添加一个新角色

本篇教程将以添加**齐天大圣（Monkey King）**为例，带你一步步了解游戏的底层架构，以及如何完整地将一个拥有“专属外观、专属被动、专属大招”的英雄角色加入到游戏中。

添加一个完整的角色通常需要分为 **4 个步骤**：

---

## 步骤 1：创建角色的基础配置文件
**涉及文件**：新建 `js/characters/你的角色名.js`（例如：`js/characters/MonkeyKing.js`）

**这是干嘛的？**
这是该角色的“灵魂”，定义了角色的各项数值、移动偏好、技能面板以及在画布（Canvas）上的长相。
你需要导出一个包含各种属性的对象，例如：
```javascript
export const monkey_king = {
  isHero: true,              // 是否为英雄角色
  nameCN: '大圣',            // UI显示的中文名
  weaponType: 'melee',       // 攻击类型 (melee近战 / ranged远程)
  movePattern: 'dash',       // 移动偏好 (linear直线 / dash滑步 / flank绕后 / keepDistance风筝)
  attackPower: 22,           // 攻击力
  attackSpeed: 0.8,          // 攻击冷却(秒)，越小越快
  attackRange: 100,          // 攻击/索敌距离
  
  // 主动技能定义 (如果有)
  skill: {
    type: 'havoc_in_heaven', // 技能ID，稍后会在路由里用到
    cooldown: 12,            // 冷却时间
    // ...其他参数
  },
  
  // 被动技能定义 (如果有)
  passives: [
    { id: 'jingu_bang', type: 'jingu_bang' } // 被动ID，稍后会在被动处理器里用到
  ],
  
  // 外观绘制函数 (Canvas API)
  drawDecorations: function(ctx, x, y, angle, size, time) {
    // 在这里用代码画出你的武器、披风、特效等
  }
};
```

---

## 步骤 2：将角色注册到游戏中
**涉及文件**：修改 `js/characters/index.js`

**这是干嘛的？**
游戏启动时，UI 图鉴界面和战斗管理器都需要知道目前游戏里总共有哪些角色。`index.js` 是所有角色的“花名册”。
**怎么做？**
1. 在文件顶部导入你刚才写的角色文件：
   `import { monkey_king } from './MonkeyKing.js';`
2. 在文件底部的 `characterData` 字典中将其导出：
   ```javascript
   export const characterData = {
     // ...其他角色
     monkey_king
   };
   ```
*完成这一步后，你的角色就已经可以出现在游戏图鉴里，并且能在战斗中刷出来了！*

---

## 步骤 3：实现角色的专属“被动技能”
**涉及文件**：修改 `js/skills/Passives.js`

**这是干嘛的？**
如果你的角色在普攻时有特殊效果（比如大圣的金箍棒能穿透，或者吸血、减速），统一在这里处理。
**怎么做？**
找到 `applyMeleeHitPassives`（近战）或对应的远程被动函数，在里面加一个 `if` 判断拦截：
```javascript
  // 拦截我们在步骤1中定义的被动ID
  if (fighter.hasPassive('jingu_bang')) {
    // 触发特效
    effectSystem.addHitEffect(primaryTarget.x, primaryTarget.y, '#FFD700');
    // 执行附带的特殊逻辑（比如调用现成的穿透伤害函数）
    applyPiercingLineDamage(fighter, damage * 0.8, 150, 30, primaryTarget, effectSystem);
  }
```

---

## 步骤 4：实现角色的专属“主动大招”
**涉及文件**：新建 `js/skills/abilities/你的技能名.js` 以及修改 `js/skills/SkillRegistry.js`

**这是干嘛的？**
1. **新建技能文件**：写具体的大招表现，比如全屏震动、召唤分身等（例如新建 `HavocInHeaven.js`）。
```javascript
// HavocInHeaven.js 示例
export function executeHavocInHeaven(caster, skill, weaponSystem, effectSystem) {
  effectSystem.screenShake(10); // 震动屏幕
  // 遍历所有敌人，范围内的扣血并眩晕...
}
```
2. **注册技能路由**：游戏需要知道，当角色释放 `type: 'havoc_in_heaven'` 的技能时，去执行哪段代码。这就需要修改 `SkillRegistry.js`，在 `switch(skill.type)` 语句中加一个分支：
```javascript
// SkillRegistry.js
import { executeHavocInHeaven } from './abilities/HavocInHeaven.js';

export function executeSkillStrategy(caster, skill, weaponSystem, effectSystem) {
    switch (skill.type) {
        // ...其他技能
        case 'havoc_in_heaven':
            executeHavocInHeaven(caster, skill, weaponSystem, effectSystem);
            break;
    }
}
```

---
**大功告成！** 只要照着这 4 步走，任何天马行空的角色都可以完美融入游戏的战斗框架中！

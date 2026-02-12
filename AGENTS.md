# 依存の方向性について

DDDにおける依存の方向性に従います

```md
index.ts (アプリケーションのエントリーポイント)
 ↓
application/* (ユースケース層)
 ↓
domain/* (ドメイン層)
 ↑
infrastructure/* (インフラ層)
```

- domain層ではinterfaceを定義し、infrastructure層でそのinterfaceを実装します

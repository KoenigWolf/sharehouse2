# Claude Code 向けプロンプト: 生ボタンを shadcn Button に統一

以下をコピーして Claude Code（または Cursor エージェント）に渡して実行してください。

---

## 依頼文（そのまま貼り付けて使う）

```
このプロジェクトでは shadcn/ui の Button コンポーネント（@/components/ui/button）が用意されているが、まだどこからも import されておらず、すべて生の <button> で実装されている。

次の方針で、生の <button> をすべて shadcn の Button に置き換えてほしい。

【方針】
1. 各ファイルで `import { Button } from "@/components/ui/button"` を追加する。
2. `<button ...>` を `<Button ...>` に置き換える。既存の props（type, onClick, aria-label, className, disabled, children など）はそのまま渡す。
3. variant / size は役割に合わせて選ぶ:
   - プライマリ操作（送信・保存・ログイン）: variant="default"
   - セカンダリ・枠線系: variant="outline"
   - アイコンのみ・控えめ: variant="ghost"
   - 削除・危険操作: variant="destructive"
   - リンク風: variant="link"
   - サイズは必要に応じて size="sm" / "lg" / "icon" などを使う。
4. 既存の className は Button の className に渡し、デザインが崩れないようにする。buttonVariants と競合する場合は必要なスタイルだけ残す。
5. aria-label や type="button" などアクセシビリティ・挙動は維持する。

【対象ファイルとおおよその箇所】
- src/components/my-page-profile.tsx（1箇所）
- src/components/residents-grid.tsx（6箇所）
- src/components/logout-button.tsx（1箇所）
- src/components/gallery-upload-section.tsx（1箇所）
- src/components/photo-lightbox.tsx（3箇所）
- src/components/room-photos-gallery.tsx（1箇所）
- src/components/garbage-schedule-view.tsx（1箇所）
- src/components/info-page-content.tsx（3箇所）
- src/app/login/page.tsx（4箇所）
- src/app/error.tsx（1箇所）
- src/components/wifi-info-form.tsx（2箇所）
- src/app/global-error.tsx（1箇所）
- src/components/profile-edit-form.tsx（4箇所）
- src/components/room-photo-manager.tsx（2箇所）
- src/components/garbage-admin-panel.tsx（6箇所）
- src/components/wifi-info-list.tsx（5箇所）
- src/components/tea-time-match-card.tsx（2箇所）
- src/components/residents-filter.tsx（1箇所）

1ファイルずつ、または関連するコンポーネントごとに置き換え、動作と見た目が維持されていることを確認できるようにしてほしい。
```

---

## 補足（必要なら渡す）

- **Button の API**: `src/components/ui/button.tsx` を参照。`variant`, `size`, `className`, `asChild` および通常の `<button>` の props を受け付ける。
- **デザイン**: プロジェクトは Muji 風の落ち着いたトーン（DESIGN_GUIDELINES.md）なので、目立ちすぎる variant は避け、`default` / `outline` / `ghost` を中心に選ぶとよい。

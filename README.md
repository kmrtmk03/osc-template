# OSC Web Template

WebブラウザとOSC (Open Sound Control) 対応アプリケーション（SuperCollider, Max/MSP, TouchDesignerなど）との間で、リアルタイムな双方向通信を実現するためのテンプレートプロジェクトです。

WebSocketを介してWeb UIからOSCメッセージを送信し、OSCデバイスからのメッセージをリアルタイムに受信できます。

![demo](httpsd://raw.githubusercontent.com/your-username/osc-template/main/docs/images/demo.png) 
※デモ画像はまだありません。

## ✨ 主な機能

-   **OSC ⇔ WebSocketブリッジ**:
    -   クライアント (Webブラウザ) ⇔ サーバー (Node.js) ⇔ OSCデバイス
    -   双方向のメッセージ通信を中継します。
-   **セキュアな通信**:
    -   HTTPS/WSSを使用し、通信を暗号化します。
-   **モダンなフロントエンド**:
    -   React, Vite, TypeScriptで構築されており、簡単にUIをカスタマイズできます。
    -   `useOscClient` カスタムフックにより、コンポーネントから簡単にOSC通信を扱えます。

## 🛠️ 技術スタック

-   **フロントエンド**: React, Vite, TypeScript, Sass
-   **バックエンド**: Node.js, TypeScript, ws (WebSocket), node-osc
-   **プロトコル**: WebSocket (WSS), OSC (UDP)

## 🚀 セットアップと実行方法

### 1. 前提条件

-   [Node.js](https://nodejs.org/) (v18以上を推奨)
-   [pnpm](https://pnpm.io/ja/installation) (npmやyarnでも代用可能)
-   [OpenSSL](https://www.openssl.org/) (自己署名証明書の作成に必要)

### 2. インストール

リポジトリをクローンし、依存パッケージをインストールします。

```bash
git clone https://github.com/your-username/osc-template.git
cd osc-template
pnpm install
```

### 3. 自己署名証明書の作成

本プロジェクトはHTTPS/WSSによるセキュアな通信が前提です。以下のコマンドで`certs`ディレクトリに自己署名証明書を生成します。

```bash
# プロジェクトルートにいることを確認
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -subj "/C=JP/ST=Tokyo/L=Chiyoda/O=YourOrg/OU=YourDept/CN=localhost"
```

> **Note**
> ブラウザでアクセスする際に警告が表示されますが、これは自己署名証明書のためです。開発中はそのままアクセスを許可してください。

### 4. IPアドレスの設定

お使いの環境に合わせて、3箇所のIPアドレスをPCのローカルIPアドレスに書き換える必要があります。

**(1) OSCサーバー (送信先)**

OSCメッセージの送信先（SuperColliderなどを実行しているPC）のIPアドレスを指定します。

-   **ファイル**: `server/osc-server.ts`
-   **箇所**: `remoteAddress`

```ts:server/osc-server.ts
const udpPort = new osc.UDPPort({
  // ...
  remoteAddress: "192.168.XX.XX", // 👈 ここを書き換える
  // ...
});
```

**(2) WebSocketサーバーの起動ログ**

コンソールに表示されるURLを、実際にアクセスできるものに合わせます。

-   **ファイル**: `server/osc-server.ts`
-   **箇所**: `server.listen` のコールバック

```ts:server/osc-server.ts
server.listen(8081, "0.0.0.0", () => {
  // 開発環境のPCのIPアドレスを指定
  console.log("WSS server running on wss://192.168.XX.XX:8081"); // 👈 ここを書き換える
});
```

**(3) フロントエンド (接続先)**

Webブラウザが接続するWebSocketサーバーのURLを指定します。

-   **ファイル**: `src/components/App/App.tsx`
-   **箇所**: `OscClient`コンポーネントの`webSocketUrl`プロパティ

```tsx:src/components/App/App.tsx
function App() {
  // (2)で指定したIPアドレスと同じものを指定
  const wsUrl = "wss://192.168.XX.XX:8081"; // 👈 ここを書き換える

  return (
    <div className={styles.app}>
      <OscClient webSocketUrl={wsUrl} />
    </div>
  );
}
```

### 5. サーバーとフロントエンドの起動

2つのターミナルを開き、それぞれでコマンドを実行します。

**ターミナル1: OSC/WSSサーバー**

```bash
# package.jsonに以下のスクリプトを追加すると便利です
# "server": "ts-node server/osc-server.ts"
pnpm run server
```
> `pnpm run server` を実行するには、`package.json`の`scripts`に`"server": "ts-node server/osc-server.ts"`を追加してください。

**ターミナル2: フロントエンド (Vite)**

```bash
pnpm run dev
```

起動後、ターミナルに表示されるURL (`https://localhost:5173`など) にブラウザでアクセスしてください。

## 使い方

-   **OSCメッセージの送信**:
    1.  ブラウザでページを開きます。
    2.  [OSCを送る]ボタンをクリックします。
    3.  `server/osc-server.ts`で設定した`remoteAddress`と`remotePort`にOSCメッセージが送信されます。
-   **OSCメッセージの受信**:
    1.  OSCデバイスから`server/osc-server.ts`の`localPort` (デフォルト: 57121) にメッセージを送信します。
    2.  受信したメッセージがWebページ上にリアルタイムで表示されます。

## 🔧 カスタマイズ

-   **送信するOSCメッセージ**:
    -   `src/components/OscClient/OscClient.tsx`内の`handleSendClick`関数を編集します。
-   **OSCポート番号**:
    -   `server/osc-server.ts`内の`osc.UDPPort`の設定値を変更します。
-   **UIデザイン**:
    -   `src/components/**/*.tsx`や`*.sass`ファイルを編集します。

## 📄 ライセンス

This project is licensed under the MIT License.
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import https from "node:https";
import { WebSocketServer, WebSocket } from "ws";
import osc from "osc";

// ===== HTTPS サーバー =====
const server = https.createServer({
  cert: fs.readFileSync("../certs/cert.pem"),
  key: fs.readFileSync("../certs/key.pem"),
}, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end("WSS server is running\n");
});

// ===== WSS (WebSocket over HTTPS) =====
const wss = new WebSocketServer({ server });
server.listen(8081, "0.0.0.0", () => {
  console.log("WSS server running on wss://192.168.11.8:8081");
});
// ===== OSC (UDP) ポート =====
const udpPort = new osc.UDPPort({
  // このサーバーがOSCメッセージを受信するためにリッスンするIPアドレスとポート
  localAddress: "0.0.0.0",
  localPort: 6668,
  // OSCメッセージの引数に型情報を含める設定
  metadata: true,
});

// UDPポートを開き、メッセージの送受信を開始
udpPort.open();

// ルーティングテーブル: OSCアドレスのプレフィックスと送信先をマッピングします。
// ルールは上から順に評価され、最初に一致したものが使われます。
const oscRoutes = [
  {
    prefix: "/test/1",
    target: { name: "Test1", address: "192.168.11.8", port: 6668 },
  },
  {
    prefix: "/test/2",
    target: { name: "Test2", address: "192.168.11.8", port: 6668 },
  },
];

// ----- WSS → OSC -----
wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (isOscMessage(msg)) {
        // ルーティングテーブルから、OSCアドレスに一致するルールを検索
        const route = oscRoutes.find((r) => msg.address.startsWith(r.prefix));

        if (route) {
          // 一致するルートが見つかった場合、その宛先に送信
          const { name, address, port } = route.target;
          udpPort.send(msg, address, port);
          console.log(
            `Message routed to ${name} (${address}:${port}):`,
            msg
          );
        } else {
          // どのルートにも一致しなかった場合
          console.log("No route found for message. Not sent:", msg);
        }
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });
});

// ----- OSC → WSS -----
// この部分をデバッグ用のコードに置き換えてみてください
udpPort.on("message", (oscMsg) => {
  console.log(`[サーバーログ 1] OSCメッセージ受信:`, oscMsg);

  const json = JSON.stringify(oscMsg);

  // 接続中のクライアント数をチェック
  console.log(`[サーバーログ 2] 現在のWebSocketクライアント数: ${wss.clients.size}`);

  if (wss.clients.size === 0) {
    console.log("[サーバーログ !] 送信先クライアントがいないため、処理を中断します。");
    return; // この行が重要です
  }

  wss.clients.forEach((client) => {
    // 各クライアントの接続状態をチェック
    if (client.readyState === WebSocket.OPEN) { 
      console.log(`[サーバーログ 3] クライアントへWebSocketメッセージを送信します...`);
      client.send(json);
      console.log('[サーバーログ 4] 送信完了:', json);
    } else {
      console.log(`[サーバーログ !] 接続がOPENではないクライアントがいたため、送信をスキップしました。 readyState: ${client.readyState}`);
    }
  });
});

// 型ガード (最低限)
function isOscMessage(x: any): x is osc.OscMessage {
  return typeof x?.address === "string" && Array.isArray(x?.args);
}
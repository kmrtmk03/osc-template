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
  localAddress: "0.0.0.0",
  localPort: 57121,       // 受信用
  remoteAddress: "192.168.11.8",
  remotePort: 57121,      // 送信先 (SuperCollider など)
  metadata: true,         // 型情報付き
});
udpPort.open();

// ----- WSS → OSC -----
wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (isOscMessage(msg)) udpPort.send(msg);
      console.log(msg)
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
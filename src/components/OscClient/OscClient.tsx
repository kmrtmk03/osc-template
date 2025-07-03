import { useOscClient } from "../../hooks/useOscClient";

/** OscClientコンポーネントのPropsの型定義 */
type OscClientProps = {
  /** 接続先のWebSocketサーバーのURL (例: "wss://192.168.1.1:8081") */
  webSocketUrl: string;
};
/**
 * WebSocketサーバーに接続し、OSCのようなメッセージを送受信するUIコンポーネント。
 * 実際のロジックはuseOscClientカスタムフックに委譲されています。
 * @param {OscClientProps} props コンポーネントのプロパティ
 */
const OscClient = ({ webSocketUrl }: OscClientProps) => {
  // useOscClientフックから状態と関数を取得
  const {
    connectionStatus,
    lastMessage,
    receivedAddress,
    receivedValues,
    sendOscMessage,
  } = useOscClient(webSocketUrl);

  // SuperColliderにメッセージを送信する
  const handleSendToScClick = () => {
    sendOscMessage({
      address: "/test/1",
      args: [
        { type: "s", value: "default" },
        { type: "f", value: Math.random() * 400 + 200 }, // 200-600Hzのランダムな周波数
      ],
    });
  };

  // VRChatにメッセージを送信する
  const handleSendToVrcClick = () => {
    sendOscMessage({
      address: "/test/2",
      args: [{ type: "f", value: Math.random() }], // 0.0-1.0のランダムな値
    });
  };

  // コンポーネントのUIをレンダリングする。
  return (
    <div>
      <h2>OSC送信テスト</h2>
      <p>WebSocket URL: {webSocketUrl}</p>
      <p>接続状況: {connectionStatus}</p>
      <p>最終受信メッセージ(生データ): {lastMessage || "なし"}</p>
      <p>受信したOSCアドレス: {receivedAddress || "なし"}</p>
      <div>
        <p>受信した値:</p>
        {receivedValues.length > 0
          ? receivedValues.map((value, index) => (
              <p key={index}>・{String(value)}</p>
            ))
          : <p>・なし</p>}
      </div>
      <button onClick={handleSendToScClick}>test1に送信</button>
      <button onClick={handleSendToVrcClick}>test2に送信</button>
    </div>
  );
};

export default OscClient;
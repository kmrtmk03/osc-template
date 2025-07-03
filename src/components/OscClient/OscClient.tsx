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

  // ボタンクリック時に送信するメッセージを定義
  const handleSendClick = () => {
    const msg = {
      address: "/hello",
      args: [
        { type: "s", value: "Hello, OSC!" },
        { type: "f", value: 440.0 },
      ],
    };
    sendOscMessage(msg);
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
      <button onClick={handleSendClick}>OSCを送る</button>
    </div>
  );
};

export default OscClient;
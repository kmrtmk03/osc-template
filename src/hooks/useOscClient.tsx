import { useEffect, useRef, useState, useCallback } from "react";

/** OSCメッセージの型定義 */
type OscMessage = {
  address: string;
  args: { type: string; value: string | number }[];
};

/** useOscClientフックが返す値の型定義 */
export type UseOscClientReturn = {
  connectionStatus: string;
  lastMessage: string | null;
  receivedAddress: string | null;
  receivedValues: (string | number)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendOscMessage: (message: Omit<OscMessage, "args"> & { args: { type: string; value: any }[] }) => void;
};

/**
 * WebSocketとOSCメッセージの送受信ロジックを管理するカスタムフック。
 * @param {string} webSocketUrl 接続先のWebSocketサーバーのURL
 * @returns {UseOscClientReturn} 接続状態、受信データ、送信関数を含むオブジェクト
 */
export const useOscClient = (webSocketUrl: string): UseOscClientReturn => {
  // WebSocketインスタンスを保持するためのuseRef。再レンダリング間でインスタンスを維持します。
  const wsRef = useRef<WebSocket | null>(null);
  // WebSocketの接続状況を管理・表示するためのuseState。
  const [connectionStatus, setConnectionStatus] = useState("未接続");
  // 再接続を試みるためのトリガーとなるstate
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  // 再接続タイマーのIDを保持するためのuseRef
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  // サーバーから受信した最後のメッセージを保存・表示するためのuseState。
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  // 受信したOSCメッセージから抽出した値を保存するためのuseState。
  const [receivedValues, setReceivedValues] = useState<(string | number)[]>([]);
  // 受信したOSCメッセージのアドレスを保存するためのuseState。
  const [receivedAddress, setReceivedAddress] = useState<string | null>(null);

  /**
   * WebSocketサーバーからメッセージを受信したときに呼び出されるコールバック関数。
   * 受信データをパースし、コンソールに出力し、関連するstateを更新します。
   * @param {MessageEvent} event WebSocketから受信したメッセージイベント
   */
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    console.log("WebSocket メッセージ受信:", event.data);
    setLastMessage(event.data);

    try {
      const message: OscMessage = JSON.parse(event.data);
      console.log("受信したOSCメッセージ (パース後):", message);

      // 受信メッセージからアドレスと値を抽出し、stateを更新
      setReceivedAddress(message.address);

      if (message && Array.isArray(message.args)) {
        const values = message.args.map((arg) => arg.value);
        setReceivedValues(values);
        console.log("抽出した値:", values);
      } else {
        setReceivedValues([]);
      }
    } catch (e) {
      // パースに失敗した場合は、関連するstateをリセット
      console.log("受信したOSCメッセージ (パースエラー):", event.data, e);
      setReceivedAddress(null);
      setReceivedValues([]);
    }
  }, []);

  // WebSocket接続のライフサイクルを管理するためのuseEffectフック。
  // URLまたは再接続トリガーが変更されたときに実行されます。
  useEffect(() => {
    // 初回接続か再接続かに応じて接続ステータスを設定
    if (reconnectAttempt > 0) {
      setConnectionStatus("再接続中...");
    } else {
      setConnectionStatus("接続中...");
    }

    const ws = new WebSocket(webSocketUrl);
    wsRef.current = ws;

    // 接続成功時のイベントハンドラ
    ws.onopen = () => {
      console.log("WebSocket 接続成功");
      setConnectionStatus("接続済み");
      // 接続に成功したら再接続の試行回数をリセット
      if (reconnectAttempt > 0) {
        setReconnectAttempt(0);
      }
    };

    // エラー発生時のイベントハンドラ
    ws.onerror = (err) => {
      console.error("WebSocket エラー", err);
      // onerrorの後にoncloseが呼ばれるため、再接続処理はoncloseに任せる
    };

    // 接続切断時のイベントハンドラ（自動再接続ロジック）
    ws.onclose = () => {
      console.log("WebSocket 切断");
      setConnectionStatus("再接続待機中...");

      // 3秒後に再接続を試みるために、reconnectAttempt stateを更新
      reconnectTimerRef.current = setTimeout(() => {
        setReconnectAttempt((prev) => prev + 1);
      }, 3000);
    };

    ws.onmessage = handleWebSocketMessage;

    // コンポーネントのアンマウント時や、依存配列の値が変更された際に実行されるクリーンアップ関数
    return () => {
      // 実行中の再接続タイマーがあればクリアする
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      // 古いWebSocketインスタンスのイベントハンドラが意図せず実行されるのを防ぐ
      ws.onclose = null;
      ws.close();
    };
  }, [webSocketUrl, handleWebSocketMessage, reconnectAttempt]); // 依存配列

  /**
   * OSCメッセージをWebSocketサーバーに送信する関数。
   * @param message 送信するOSCメッセージオブジェクト
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendOscMessage = useCallback((message: Omit<OscMessage, "args"> & { args: { type: string; value: any }[] }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log("OSCメッセージを送信しました:", message);
    } else {
      console.warn(
        "WebSocketが接続されていません。メッセージは送信されませんでした。"
      );
    }
  }, []); // wsRefは不変なため、依存配列は空

  // フックの利用側コンポーネントが必要とする状態と関数を返す
  return {
    connectionStatus,
    lastMessage,
    receivedAddress,
    receivedValues,
    sendOscMessage,
  };
};
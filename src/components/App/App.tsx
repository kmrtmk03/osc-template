import styles from './App.module.sass'
import OscClient from '../OscClient/OscClient.tsx';

const serverIp: string = "192.168.11.8";


function App() {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.inner}>
        <OscClient webSocketUrl={`wss://${serverIp}:8081`} />
      </div>
    </div>
  )
}

export default App
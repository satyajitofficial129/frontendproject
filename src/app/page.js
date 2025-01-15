import Image from "next/image";
import styles from "./page.module.css";
import LoginPage from "./login/page";

export default function Home() {
  return (
    <div>
      <LoginPage />
    </div>
  );
}

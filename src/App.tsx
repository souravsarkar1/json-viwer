// import "./App.css"
import { useState } from "react"
import JsonTreeVisualizer from "./Jsontreevisualizer"
import CreativeJsonLoginPage from "./Login"
import { Toaster } from "react-hot-toast";
const App = () => {
  const [isAuth, setIsAuth] = useState<boolean>(!!localStorage.getItem("isAuth"));
  console.log(isAuth);
  return (
    <div>
            <Toaster position="top-right" />

      {isAuth ? <JsonTreeVisualizer /> :
      
        <CreativeJsonLoginPage setIsAuth={setIsAuth} />}
    </div>
  )
}

export default App

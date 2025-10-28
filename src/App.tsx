// import "./App.css"
import { useState } from "react"
import JsonTreeVisualizer from "./Jsontreevisualizer"
import CreativeJsonLoginPage from "./Login"
import { Toaster } from "react-hot-toast";
import { ReactFlowProvider } from "reactflow";
const App = () => {
  const [isAuth, setIsAuth] = useState<boolean>(!!localStorage.getItem("isAuth"));
  console.log(isAuth);
  return (
    <div>
      <Toaster position="bottom-right" />

      {isAuth ?

        <ReactFlowProvider>
          <JsonTreeVisualizer />
        </ReactFlowProvider>
        :

        <CreativeJsonLoginPage setIsAuth={setIsAuth} />}
    </div>
  )
}

export default App

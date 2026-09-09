import { toast } from "react-toastify";

function showError(msg: String) {
  toast.error(msg, {
    position: "top-left",
    autoClose: 4000,
  });
}

export default showError;

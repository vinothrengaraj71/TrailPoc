import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5010/api/messages",
});

export default API;

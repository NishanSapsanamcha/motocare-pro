import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const apiCall = async (method, endpoint, options = {}) => {
  const { data, params, headers } = options;

  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      params,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
    return response?.data;
  } catch (error) {
    if (error.response && error.response.message) {
      throw Error(error.response.message || "Something went wrong");
    } else {
      throw Error("Server unreachable");
    }
  }
};

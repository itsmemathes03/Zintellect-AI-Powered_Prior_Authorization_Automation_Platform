import api from "./api";

export const submitRequest = (formData) =>
  api.post("/submit-request", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getRequestStatus = (requestId) =>
  api.get(`/request-status/${requestId}`);

export const getAllRequests = () =>
  api.get("/all-requests");
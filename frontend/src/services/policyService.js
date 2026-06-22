import api from "./api";

export const uploadPolicy = (formData) =>
  api.post("/upload-policy", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getPolicies = (providerId) =>
  api.get(`/provider-policies/${providerId}`);

export const deletePolicy = (policyId) =>
  api.delete(`/delete-policy/${policyId}`);
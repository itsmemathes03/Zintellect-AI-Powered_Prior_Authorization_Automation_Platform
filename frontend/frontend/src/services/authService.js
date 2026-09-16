import api from "./api";

export const providerRegister = (data) =>
  api.post("/provider-register", data);

export const providerLogin = (data) =>
  api.post("/provider-login", data);

export const registerInsurance = (data) =>
  api.post("/register-insurance-member", data);

export const verifyInsurance = (data) =>
  api.post("/verify-insurance", data);

export const getInsuranceDetails = (id) =>
  api.get(`/insurance-details/${id}`);
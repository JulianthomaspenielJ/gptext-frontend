// import axios from "axios";
// let isRefreshing = false;
// let refreshSubscribers = [];

// function subscribeTokenRefresh(cb) {
//   refreshSubscribers.push(cb);
// }
// function onRrefreshed(token) {
//   refreshSubscribers.forEach((cb) => cb(token));
//   refreshSubscribers = [];
// }

// const refreshApi = axios.create({
//   baseURL: "http://localhost:5000/api/authentication",
//   withCredentials: true,
// });

// const createApiInstance = (baseURL) => {
//   const api = axios.create({
//     baseURL,
//     headers: {
//       "Content-Type": "application/json",
//     },
//     withCredentials: true, // send cookies
//   });

//   // attach access token automatically
//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//       const original = error.config;

//       if (error.response?.status === 401 && !original._retry) {
//         original._retry = true;

//         // If a refresh is already happening, queue the request
//         if (isRefreshing) {
//           return new Promise((resolve) => {
//             subscribeTokenRefresh((token) => {
//               original.headers.Authorization = `Bearer ${token}`;
//               resolve(api(original));
//             });
//           });
//         }

//         isRefreshing = true;

//         try {
//           const res = await refreshApi.get("/refresh-token");

//           const newToken = res.data.accessToken;
//           localStorage.setItem("accessToken", newToken);

//           isRefreshing = false;
//           onRrefreshed(newToken);

//           console.log("newToken", newToken);
//           original.headers.Authorization = `Bearer ${newToken}`;
//           return api(original);
//         } catch (err) {
//           isRefreshing = false;

//           localStorage.removeItem("accessToken");
//           localStorage.removeItem("user");

//           window.location.href = "/login";
//           return Promise.reject(err);
//         }
//       }

//       return Promise.reject(error);
//     },
//   );

//   // api.interceptors.response.use(
//   //   (response) => response,
//   //   async (error) => {
//   //     const original = error.config;

//   //     // Only try refresh if:
//   //     // 1. 401 error
//   //     // 2. Original request not retried yet
//   //     // 3. User already has an accessToken (means user had logged in)
//   //     if (
//   //       error.response?.status === 401 &&
//   //       !original._retry &&
//   //       localStorage.getItem("accessToken")
//   //     ) {
//   //       original._retry = true;

//   //       alert("👍👍");

//   //       try {
//   //         const res = await axios.get(
//   //           "http://localhost:5000/api/authentication/refresh-token",
//   //           { withCredentials: true },
//   //         );

//   //         const newToken = res.data.accessToken;
//   //         localStorage.setItem("accessToken", newToken);

//   //         original.headers.Authorization = `Bearer ${newToken}`;
//   //         return api(original);
//   //       } catch (err) {
//   //         alert("👍👍");
//   //         localStorage.removeItem("accessToken");
//   //         window.location.href = "/login";
//   //         // logout user here
//   //       }
//   //     }

//   //     return Promise.reject(error);
//   //   },
//   // );

//   return api;
// };

// // Create API instances
// const weaverApi = createApiInstance("http://localhost:5000/api/weaver");
// const loomOptionsApi = createApiInstance(
//   "http://localhost:5000/api/loom/options",
// );
// const loomApi = createApiInstance("http://localhost:5000/api/loom");
// const taskApi = createApiInstance("http://localhost:5000/api/task");
// const taskOptionsApi = createApiInstance(
//   "http://localhost:5000/api/task/options",
// );
// const productionPlanningApi = createApiInstance(
//   "http://localhost:5000/api/productionplanning",
// );
// const usersApi = createApiInstance("http://localhost:5000/api/users");
// const authenticationApi = createApiInstance(
//   "http://localhost:5000/api/authentication",
// );

// export {
//   weaverApi,
//   loomOptionsApi,
//   loomApi,
//   taskOptionsApi,
//   taskApi,
//   productionPlanningApi,
//   usersApi,
//   authenticationApi,
// };

// updated code
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gpt.procease.co/gp-backend/api";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) =>
  refreshSubscribers.push(cb);

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const refreshApi = axios.create({
  baseURL: `${BASE_URL}/authentication`,
  withCredentials: true,
});

const createApi = (path: string) => {
  const instance = axios.create({
    baseURL: `${BASE_URL}${path}`,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  // Attach token automatically
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Refresh-token handling
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;

        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(instance(original));
            });
          });
        }

        isRefreshing = true;

        try {
          const res = await refreshApi.get("/refresh-token");
          const newToken = res.data.accessToken;

          localStorage.setItem("accessToken", newToken);

          isRefreshing = false;
          onRefreshed(newToken);

          original.headers.Authorization = `Bearer ${newToken}`;
          return instance(original);
        } catch (err) {
          isRefreshing = false;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export const weaverApi = createApi("/weaver");
export const loomOptionsApi = createApi("/loom/options");
export const loomApi = createApi("/loom");
export const taskApi = createApi("/task");
export const taskOptionsApi = createApi("/task/options");
export const productionPlanningApi = createApi("/productionplanning");
export const usersApi = createApi("/users");
export const productionApi = createApi("/production");
export const organizationApi = createApi("/organization");
export const organizationOptionsApi = createApi("/organization/options");
export const orderApi = createApi("/order");

export const authenticationApi = createApi("/authentication");
export const notificationApi = createApi("/notification");

export const commonApi = createApi("/common");

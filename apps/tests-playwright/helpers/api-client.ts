import { request, type APIRequestContext } from '@playwright/test';

type AuthInput = {
  email: string;
  password: string;
};

type ApiClient = {
  apiBaseUrl: string;
  api: APIRequestContext;
  authApi: APIRequestContext;
  gql: APIRequestContext;
  token: string;
  dispose: () => Promise<void>;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

const DEFAULT_API_URL = 'http://localhost:4000';

function getApiBaseUrl() {
  return (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
}

export async function createApiClient(auth: AuthInput): Promise<ApiClient> {
  const apiBaseUrl = getApiBaseUrl();
  const api = await request.newContext({ baseURL: apiBaseUrl });

  const authResp = await api.post('/auth/login', { data: auth });
  const authJson = (await authResp.json()) as { token?: string };
  const token = authJson.token;

  if (!token) {
    throw new Error('Failed to obtain API token for Playwright tests');
  }

  const gql = await request.newContext({
    baseURL: `${apiBaseUrl}/graphql`,
    extraHTTPHeaders: { authorization: `Bearer ${token}` },
  });

  const authApi = await request.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: { authorization: `Bearer ${token}` },
  });

  return {
    apiBaseUrl,
    api,
    authApi,
    gql,
    token,
    dispose: async () => {
      await gql.dispose();
      await authApi.dispose();
      await api.dispose();
    },
  };
}

export async function graphqlRequest<T>(
  gql: APIRequestContext,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const resp = await gql.post('', { data: { query, variables } });
  const json = (await resp.json()) as GraphQLResponse<T>;

  if (!resp.ok()) {
    throw new Error(`GraphQL request failed: ${resp.status()}`);
  }

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? 'GraphQL error');
  }

  if (!json.data) {
    throw new Error('GraphQL response missing data');
  }

  return json.data;
}

type StoreInput = {
  name: string;
  email?: string;
};

type ProductInput = {
  name: string;
  price: number;
  quantity?: number;
  storeId: string;
};

type CheckoutLinkInput = {
  slug: string;
  productId: string;
  storeId: string;
};

type CheckoutByLinkInput = {
  slug: string;
  customerName: string;
  email: string;
  quantity: number;
  shippingAddress: string;
};

export async function updateOrderStatus(
  gql: APIRequestContext,
  input: { orderId: string; status: string },
) {
  const data = await graphqlRequest<{ updateOrderStatus: { id: string; status: string } }>(
    gql,
    'mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!){ updateOrderStatus(orderId:$orderId, status:$status){ id status } }',
    { orderId: input.orderId, status: input.status },
  );
  return data.updateOrderStatus;
}

export async function createStore(gql: APIRequestContext, input: StoreInput) {
  const data = await graphqlRequest<{ createStore: { id: string; name: string } }>(
    gql,
    'mutation ($input: StoreInput!){ createStore(input:$input){ id name } }',
    { input },
  );
  return data.createStore;
}

export async function createProduct(gql: APIRequestContext, input: ProductInput) {
  const data = await graphqlRequest<{ addProduct: { id: string; name: string } }>(
    gql,
    'mutation ($n:String!,$p:Float!,$q:Int,$store:ID!){ addProduct(name:$n, price:$p, quantity:$q, storeId:$store){ id name } }',
    {
      n: input.name,
      p: input.price,
      q: input.quantity ?? 0,
      store: input.storeId,
    },
  );
  return data.addProduct;
}

export async function createCheckoutLink(gql: APIRequestContext, input: CheckoutLinkInput) {
  const data = await graphqlRequest<{ createCheckoutLink: { slug: string } }>(
    gql,
    'mutation ($input: CheckoutLinkInput!){ createCheckoutLink(input:$input){ slug } }',
    { input },
  );
  return data.createCheckoutLink;
}

export async function checkoutByLink(gql: APIRequestContext, input: CheckoutByLinkInput) {
  const data = await graphqlRequest<{
    startCheckoutByLink: { orderId: string; checkoutUrl: string };
  }>(
    gql,
    'mutation StartCheckoutByLink($input: CheckoutByLinkInput!){ startCheckoutByLink(input:$input){ orderId checkoutUrl } }',
    { input },
  );
  return data.startCheckoutByLink;
}

import { http, HttpResponse } from 'msw';

const MOCKED_EXPERIMENT_ID = 'exp-msw-123';
// Assuming the client uses this base URL by default
const BASE_URL = 'https://gentrace.ai/api';

export const handlers = [
  // Catch-all handler (add at the beginning for debugging)
  http.all('*', ({ request }) => {
    // IMPORTANT: Return undefined to allow other handlers to match
    return undefined;
  }),

  // Mock for startExperiment (Assuming v4 based on finishExperiment correction)
  http.post(`${BASE_URL}/v4/experiments`, async ({ request }) => {
    // You could add logic here to check request body if needed
    // const body = await request.json();
    return HttpResponse.json(
      {
        id: MOCKED_EXPERIMENT_ID,
      },
      { status: 200 },
    );
  }),

  // Mock for finishExperiment (Corrected path)
  http.post(`${BASE_URL}/v4/experiments/:id`, async ({ params }) => {
    // You could check params.id if needed
    // if (params.id !== MOCKED_EXPERIMENT_ID) { ... }
    return new HttpResponse(null, { status: 204 }); // Use 204 No Content for successful finish
  }),
];

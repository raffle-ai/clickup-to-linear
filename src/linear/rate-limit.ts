/**
 * Show Rate Limit info from the headers of a random request to the GraphQL API
 * https://developers.linear.app/docs/graphql/working-with-the-graphql-api/rate-limiting
 */
export async function checkRateLimits() {
  const token = process.env.LINEAR_API_KEY;
  if (!token) throw new Error("No API key found");

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      query: `
                query Me {
                    viewer {
                        email
                    }
                }
            `,
    }),
  });

  const limitPerHour = response.headers.get("x-ratelimit-requests-limit");
  const remaining = response.headers.get("x-ratelimit-requests-remaining");
  const ts = response.headers.get("x-ratelimit-requests-reset") || "0";
  const resetTime = new Date(parseInt(ts)).toTimeString();

  console.log({ limitPerHour, remaining, resetTime });
}

export const getSwapStatus = async (id, apiUrl) => {
  try {
    const response = await fetch(`${apiUrl}swap/${id}`);

    return response.json();
  } catch (err) {
    return {};
  }
};

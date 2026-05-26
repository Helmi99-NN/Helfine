const API_URL = "https://script.google.com/macros/s/AKfycbx28na0RROvEBfcjJKMgr-dGaq1Jq-H3d_fDCjow3RDlyxndf40Tpk3ZkoH_qm0LSc4Zw/exec";

export const fetchDatabase = async () => {
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error("Failed to fetch data");
    const json = await response.json();
    if (json.status !== 'success') throw new Error(json.message || "API Error");
    return json.data;
  } catch (error) {
    console.error("Fetch DB Error:", error);
    throw error;
  }
};

export const syncSheet = async (sheetName, dataArray) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ sheetName, data: dataArray }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      }
    });
    const json = await response.json();
    if (json.status !== 'success') throw new Error(json.message || "API Error");
    return true;
  } catch (error) {
    console.error(`Sync Sheet Error (${sheetName}):`, error);
    throw error;
  }
};

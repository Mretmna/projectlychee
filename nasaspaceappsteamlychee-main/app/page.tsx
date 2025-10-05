"use client";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

type AQIData = {
  AQI: number;
  Alert: string;
};

type CalculationResponse = {
  aqi_data: AQIData;
};

// Get color based on AQI level
const getAQIColor = (alert: string) => {
  switch (alert) {
    case "Healthy":
      return "bg-green-500";
    case "Moderate":
      return "bg-yellow-500";
    case "Unhealthy for Sensitive Groups":
      return "bg-orange-500";
    case "Unhealthy":
      return "bg-red-500";
    case "Very Unhealthy":
      return "bg-purple-700";
    case "Hazardous":
      return "bg-red-900";
    case "No Data":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const getAlertMessage = (alert: string) => {
  switch (alert) {
    case "Healthy":
      return "It&{apos}s a great day to be active outside.";
    case "Moderate":
      return "Unusually sensitive people: Consider making outdoor activities shorter and less intense. Watch for symptoms such as coughing or shortness of breath. These are signs to take it easier";
    case "Unhealthy for Sensitive Groups":
      return "Sensitive groups: Make outdoor activities shorter and less intense. Take more breaks. Watch for symptoms such as coughing or shortness of breath. Plan outdoor activities in the morning when ozone is lower.People with asthma: Follow your asthma action plan and keep quick-relief medicine handy.";
    case "Unhealthy":
      return "Sensitive groups: Do not do long or intense outdoor activities. Schedule outdoor activities in the morning when ozone is lower. Consider moving activities indoors.People with asthma: Follow your asthma action plan and keep quick-relief medicine handy. Everyone else: Reduce long or intense outdoor activity. Take more breaks, do less intense activities. Schedule outdoor activities in the morning when zone is lowe.";
    case "Very Unhealthy":
      return "Sensitive groups: Avoid all physical activity outdoors. Move activities indoors* or reschedule to when air quality will be better. People with asthma: Follow your asthma action plan and keep quick-relief medicine handy.Everyone else: Avoid long or intense outdoor exertion. Schedule outdoor activities in the morning when ozone is lower. Consider moving activities indoors.*Note: If you don't have an air conditioner, staying indoors with the windows closed may be dangerous in extremely hot weather. If you are hot, go someplace with air conditioning or check with your local government to find out if cooling centers are available in your community. this so its straig";
    case "Hazardous":
      return "Everyone: Avoid all physical activity outdoors.* People with asthma: Follow your asthma action plan and keep quick-relief medicine handy.";
    
    case "No Data":
      return "No recent air quality data was found for your location.";
    default:
      return "";
  }
};


export default function Home() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAQIData = async () => {
    try {
      const res = await fetch(`${API_URL}/calculations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const json: CalculationResponse = await res.json();
      setAqiData(json.aqi_data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        // Send coordinates to backend
        await fetch(`${API_URL}/coords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude }),
        });

        // Fetch AQI data
        await fetchAQIData();
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  const generateMapEmbedUrl = (lat: number, lon: number) =>
    `https://maps.google.com/maps?q=${lat},${lon}&t=&z=14&ie=UTF8&iwloc=B&output=embed`;

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4">Am I Safe?</h1>
        <p className="text-center mb-8">Are you breathing clean air?</p>

        {aqiData && (
          <div className={`rounded-lg shadow-lg p-6 mb-6 text-white ${getAQIColor(aqiData.Alert)}`}>
            <h2 className="text-2xl font-bold mb-2">Air Quality Index (AQI)</h2>
            <div className="flex items-end gap-4">
              <span className="text-6xl font-bold">{aqiData.AQI}</span>
              <span className="text-2xl mb-2">{aqiData.Alert}</span>
              
            </div>
            <div>
              <p className="mt-2 text-sm">{getAlertMessage(aqiData.Alert)}</p>
            </div>
            {aqiData.Alert === "No Data" && (
              <p className="mt-2 text-sm">No recent air quality data was found for your location.</p>
            )}
          </div>
        )}
        <div>These are estimate numbers, please check in with your local health services.</div>

        {coords && (
          <div className="fixed bottom-4 right-4 w-80 h-64 shadow-2xl rounded-lg overflow-hidden border-4 border-white">
            <iframe
              src={generateMapEmbedUrl(coords.latitude, coords.longitude)}
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            />
          </div>
        )}

        {loading && <p className="text-center text-gray-500 mt-4">Loading AQI data...</p>}
      </div>
    </main>
  );
}

const API_KEY = "AIzaSyCPc5gElTjJ4Se2lmo2oLNUlqfIYceQ1v8";

// Distance Matrix API - Time & Distance
async function testDistanceMatrix() {
  const origin = "Chennai";
  const destination = "Coimbatore";
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(
    destination
  )}&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  console.log("Distance Matrix Response:", JSON.stringify(data, null, 2));

  if (data.rows[0].elements[0].status === "OK") {
    console.log("Distance:", data.rows[0].elements[0].distance.text);
    console.log("Duration:", data.rows[0].elements[0].duration.text);
  } else {
    console.log("Distance Matrix Failed:", data.rows[0].elements[0].status);
  }
}

// Directions API - Full Route
async function testDirections() {
  const origin = "Chennai";
  const destination = "Coimbatore";
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(
    destination
  )}&mode=driving&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  console.log("Directions Response:", JSON.stringify(data, null, 2));

  if (data.status === "OK") {
    const route = data.routes[0].legs[0];
    console.log("Start Address:", route.start_address);
    console.log("End Address:", route.end_address);
    console.log("Total Distance:", route.distance.text);
    console.log("Total Duration:", route.duration.text);

    route.steps.forEach((step, i) => {
      console.log(
        `Step ${i + 1}: ${step.html_instructions.replace(/<[^>]*>/g, "")} - ${
          step.distance.text
        } (${step.duration.text})`
      );
    });
  } else {
    console.log("Directions Failed:", data.status);
  }
}

// Run Tests
(async () => {
  await testDistanceMatrix();
  await testDirections();
})();

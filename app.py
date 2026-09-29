from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import urllib.request
import json
import os

app = Flask(__name__)
CORS(app) # Allow requests from anywhere

import random
import re

# Global State Dictionary
DB_STATE = {
    "total_accidents": 2481,
    "high_risk_areas": 24,
    "poor_road_conditions": 31,
    "confidence_score": 78,
    "monthly_trend": [120, 190, 150, 210, 180, 240],
    "risk_segments": [25, 45, 30],
    "incidents": [
        { "name": "Agara Junction", "coords": [12.9234, 77.6483], "risk": "High", "type": "Multi-vehicle collision" },
        { "name": "Airport Road", "coords": [12.9592, 77.6492], "risk": "Medium", "type": "Traffic snarls" },
        { "name": "Attibele Toll", "coords": [12.7758, 77.7712], "risk": "High", "type": "Severe congestion" },
        { "name": "Silk Board Junction", "coords": [12.9176, 77.6231], "risk": "High", "type": "Multi-vehicle collision" },
        { "name": "Marathahalli Bridge", "coords": [12.9569, 77.7011], "risk": "Medium", "type": "Severe congestion" },
        { "name": "Hebbal Flyover", "coords": [13.0354, 77.5988], "risk": "High", "type": "Waterlogging / Flooding" },
        { "name": "Electronic City Toll", "coords": [12.8399, 77.6770], "risk": "Medium", "type": "Construction zone" },
        { "name": "Majestic Bus Stand", "coords": [12.9768, 77.5714], "risk": "High", "type": "Traffic gridlock" },
        { "name": "Koramangala 100ft Rd", "coords": [12.9343, 77.6214], "risk": "Medium", "type": "Pothole damage" },
        { "name": "Whitefield Main Rd", "coords": [12.9698, 77.7499], "risk": "Medium", "type": "Signal failure" },
        { "name": "Jayanagar 4th Block", "coords": [12.9299, 77.5824], "risk": "Low", "type": "Clear" },
        { "name": "Indiranagar 100ft Rd", "coords": [12.9783, 77.6408], "risk": "Medium", "type": "Congestion" },
        { "name": "Yeshwanthpur Circle", "coords": [13.0279, 77.5409], "risk": "High", "type": "Heavy truck traffic bottleneck" },
        { "name": "Banashankari Temple Jnc", "coords": [12.9254, 77.5467], "risk": "Medium", "type": "Traffic snarls" },
        { "name": "Yelahanka Bypass", "coords": [13.1006, 77.5963], "risk": "High", "type": "High-speed zone hazard" },
        { "name": "Madiwala Underpass", "coords": [12.9226, 77.6174], "risk": "High", "type": "Waterlogging" },
        { "name": "KR Puram Bridge", "coords": [13.0011, 77.6834], "risk": "High", "type": "Severe congestion" },
        { "name": "Peenya Industrial Area", "coords": [13.0285, 77.5196], "risk": "Medium", "type": "Poor road conditions" },
        { "name": "Bellandur ORR", "coords": [12.9304, 77.6784], "risk": "High", "type": "Tech park gridlock" },
        { "name": "BTM Layout 2nd Stage", "coords": [12.9165, 77.6101], "risk": "Medium", "type": "Signal failure" },
        { "name": "HSR Layout Sector 1", "coords": [12.9121, 77.6445], "risk": "Low", "type": "Clear" },
        { "name": "MG Road / Brigade Rd", "coords": [12.9750, 77.6015], "risk": "Medium", "type": "Pedestrian crossing risks" },
        { "name": "Malleshwaram 8th Cross", "coords": [13.0031, 77.5700], "risk": "Low", "type": "Clear" },
        { "name": "JP Nagar 3rd Phase", "coords": [12.9113, 77.5925], "risk": "Medium", "type": "Bottleneck" },
        { "name": "Basavanagudi Gandhi Bazaar", "coords": [12.9421, 77.5706], "risk": "Medium", "type": "High Pedestrian Traffic" },
        { "name": "Rajajinagar 1st Block", "coords": [13.0040, 77.5555], "risk": "Low", "type": "Clear" },
        { "name": "Vijayanagar Toll Gate", "coords": [12.9696, 77.5366], "risk": "High", "type": "Gridlock" },
        { "name": "Kengeri Satellite Town", "coords": [12.9177, 77.4838], "risk": "Low", "type": "Clear" },
        { "name": "Rajarajeshwari Nagar Arch", "coords": [12.9238, 77.5186], "risk": "Medium", "type": "Congestion" },
        { "name": "Nagarbhavi Circle", "coords": [12.9678, 77.5100], "risk": "Low", "type": "Clear" },
        { "name": "Basaveshwaranagar", "coords": [12.9961, 77.5385], "risk": "Medium", "type": "Signal failure" },
        { "name": "Mathikere", "coords": [13.0334, 77.5640], "risk": "High", "type": "Heavy truck traffic bottleneck" },
        { "name": "Vidyaranyapura", "coords": [13.0766, 77.5577], "risk": "Low", "type": "Clear" },
        { "name": "Sahakara Nagar", "coords": [13.0645, 77.5902], "risk": "Medium", "type": "Congestion" },
        { "name": "RT Nagar Main Rd", "coords": [13.0183, 77.5931], "risk": "Medium", "type": "Pedestrian crossing risks" },
        { "name": "Shivajinagar Bus Terminal", "coords": [12.9868, 77.6041], "risk": "High", "type": "Traffic gridlock" },
        { "name": "Shanti Nagar Double Rd", "coords": [12.9568, 77.5946], "risk": "Medium", "type": "Severe congestion" },
        { "name": "Ulsoor Lake Jnc", "coords": [12.9818, 77.6186], "risk": "High", "type": "Bottleneck" },
        { "name": "Richmond Town", "coords": [12.9644, 77.6006], "risk": "Medium", "type": "School Zone Traffic" },
        { "name": "CV Raman Nagar", "coords": [12.9841, 77.6698], "risk": "Medium", "type": "Congestion" },
        { "name": "Mahadevapura ORR", "coords": [12.9880, 77.6900], "risk": "High", "type": "Tech park gridlock" },
        { "name": "Brookefield Main", "coords": [12.9655, 77.7185], "risk": "Medium", "type": "Pothole damage" },
        { "name": "Varthur Kodi", "coords": [12.9406, 77.7460], "risk": "High", "type": "Severe congestion" },
        { "name": "Ramamurthy Nagar", "coords": [13.0163, 77.6785], "risk": "Medium", "type": "Signal failure" },
        { "name": "HAL Engine Division", "coords": [12.9602, 77.6601], "risk": "High", "type": "Traffic snarls" },
        { "name": "Bommanahalli Jnc", "coords": [12.9009, 77.6253], "risk": "High", "type": "Severe congestion" },
        { "name": "Uttarahalli Main Rd", "coords": [12.9060, 77.5350], "risk": "Medium", "type": "Congestion" },
        { "name": "Subramanyapura", "coords": [12.8948, 77.5451], "risk": "Low", "type": "Clear" }
    ]
}

@app.route('/')
def index():
    with open('saferoute.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.root_path, filename)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    start_loc = data.get('start', 'your starting location')
    dest_loc = data.get('destination', 'your destination')
    road = data.get('road', 'good')
    time = data.get('time', 'morning')
    
    # LIVE WEATHER INFERENCE (Open-Meteo API for Bangalore Lat/Lng)
    weather = "clear"
    try:
        req = urllib.request.Request("https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current_weather=true", headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2) as response:
            w_data = json.loads(response.read().decode())
            w_code = w_data.get('current_weather', {}).get('weathercode', 0)
            if w_code in [51,53,55,56,57,61,63,65,66,67,80,81,82]: weather = "rain"
            elif w_code in [45, 48]: weather = "fog"
            elif w_code in [95, 96, 99]: weather = "storm"
    except Exception as e:
        print("Weather API Exception: ", e)
        pass # fallback to clear
    
    # Autonomous AI Traffic Inference Engine
    high_traffic_zones = ['Silk Board', 'Hebbal', 'Marathahalli', 'K R Puram', 'Electronic City', 'Majestic', 'Yeshwanthpur']
    traffic = "low"
    
    if time in ["evening", "morning"]:
        if start_loc in high_traffic_zones or dest_loc in high_traffic_zones:
            traffic = "very-high"
        else:
            traffic = "high"
    elif time == "afternoon":
        if start_loc in high_traffic_zones or dest_loc in high_traffic_zones:
            traffic = "high"
        else:
            traffic = "medium"
    else: # Night
        if start_loc in high_traffic_zones or dest_loc in high_traffic_zones:
            traffic = "medium"
        else:
            traffic = "low"
            
    score = 20
    
    # Weather
    if weather == "rain":
        score += 20
    elif weather == "fog":
        score += 25
    elif weather == "storm":
        score += 30
        
    # Autonomously Scored Traffic
    if traffic == "medium":
        score += 10
    elif traffic == "high":
        score += 20
    elif traffic == "very-high":
        score += 30
        
    # Road condition
    if road == "moderate":
        score += 10
    elif road == "poor":
        score += 25
    elif road == "construction":
        score += 30
        
    # Travel time
    if time == "evening":
        score += 10
    elif time == "night":
        score += 15
        
    if score > 100:
        score = 100
        
    # Determine risk level
    alternative = None
    
    if score < 40:
        risk_level = "Low"
        recommendation = f"The route from {start_loc} to {dest_loc} indicates relatively low accident risk."
        action = "none"
    elif score < 70:
        risk_level = "Medium"
        recommendation = f"Moderate risk detected on the way to {dest_loc}. Stay alert and maintain a safe speed."
        action = "suggest_alternative"
        alternative = {
            "action_text": f"Consider departing earlier to bypass traffic at {start_loc}.",
            "route_name": "Secondary Arterial Roads",
            "estimated_risk": int(score * 0.7)
        }
    else:
        risk_level = "High"
        recommendation = f"CRITICAL: High accident probability detected between {start_loc} and {dest_loc}."
        action = "reroute"
        
        # Super dynamic alternative generation
        alt_route = "Outer Ring Road (ORR)"
        if "Silk Board" in start_loc or "Silk Board" in dest_loc:
            alt_route = "Elevated Expressway / Hosur Road"
        elif "Whitefield" in start_loc or "Whitefield" in dest_loc:
            alt_route = "Old Airport Road / HAL"
            
        alternative = {
            "action_text": f"Avoid {start_loc} during peak traffic hours.",
            "route_name": alt_route,
            "estimated_risk": int(score * 0.55)
        }
        
    start_coords = [12.9716, 77.5946]
    dest_coords = [12.9716, 77.5946]
    
    for spot in DB_STATE.get('incidents', []):
        if spot['name'].lower() == start_loc.lower():
            start_coords = spot['coords']
        if spot['name'].lower() == dest_loc.lower():
            dest_coords = spot['coords']
            
    return jsonify({
        "risk_score": score,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "action": action,
        "alternative": alternative,
        "predicted_traffic": traffic.replace("-", " ").title(),
        "live_weather": weather.title(),
        "start_coords": start_coords,
        "dest_coords": dest_coords
    })

@app.route('/live-incidents', methods=['GET'])
def get_live_incidents():
    return jsonify({"incidents": DB_STATE["incidents"]})

@app.route('/dashboard-data', methods=['GET'])
def get_dashboard_data():
    DB_STATE["high_risk_areas"] = sum(1 for spot in DB_STATE["incidents"] if spot.get('risk') == "High")
    return jsonify(DB_STATE)

def parse_coords(loc_str):
    # Try to parse "Lat: X, Lng: Y"
    match = re.search(r"Lat:\s*([\d\.-]+),\s*Lng:\s*([\d\.-]+)", loc_str)
    if match:
        return [float(match.group(1)), float(match.group(2))]
    return [12.9716 + (random.random()-0.5)*0.1, 77.5946 + (random.random()-0.5)*0.1]

@app.route('/report-incident', methods=['POST'])
def report_incident():
    data = request.json
    coords = parse_coords(data.get('location', ''))
    
    DB_STATE["incidents"].append({
        "name": "User Reported Hazard",
        "coords": coords,
        "risk": "Medium",
        "type": data.get('type', 'Unknown Hazard')
    })
    DB_STATE["total_accidents"] += 1
    DB_STATE["poor_road_conditions"] += 1
    
    return jsonify({
        "status": "success",
        "message": f"Successfully integrated {data.get('type')} into map analytics.",
        "incident_id": f"INC-{random.randint(10000,99999)}",
        "timestamp": data.get('timestamp')
    })

@app.route('/sos-alert', methods=['POST'])
def sos_alert():
    data = request.json
    service = data.get('service', 'emergency services')
    coords = parse_coords(data.get('location', ''))
    
    DB_STATE["incidents"].append({
        "name": f"SOS Alert ({service})",
        "coords": coords,
        "risk": "High",
        "type": "Emergency SOS Trigger"
    })
    DB_STATE["high_risk_areas"] += 1
    DB_STATE["total_accidents"] += 1
    
    return jsonify({
        "status": "alert_dispatched",
        "message": f"Distress signal saved. Map cluster updated.",
        "priority": "CRITICAL"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)

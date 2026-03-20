# RainShield: Parametric Insurance for Gig Workers
**Phase 1: Ideation & Foundation | Hackathon Submission**

**RainShield** is a micro-insurance platform designed to shield delivery partners and gig workers from income loss caused by adverse weather conditions.

---

## 1. Requirement & Persona Scenarios
Gig workers (Zomato, Swiggy, Uber) lose **30-60%** of their daily earnings during heavy rain due to safety risks and delivery friction. Traditional insurance is too slow and complex for this segment.

### Personas
-   **The Delivery Partner (Riaan):** Earns ₹800/day. Heavy rain stops his work for 5 hours. He loses ₹400. RainShield pays him ₹250 instantly based on rainfall data.
-   **The Taxi Driver (Aditi):** Extreme heat reduces her trip frequency and increases fuel costs. RainShield provides a "heat-wave subsidy" payout.

### Application Workflow
1.  **Subscribe:** Worker opts into a ₹49/week micro-plan.
2.  **Monitor:** RainShield polls weather APIs (OpenWeatherMap) for real-time triggers in the worker's zone.
3.  **Trigger:** An event (e.g., >10mm rain) is detected.
4.  **Payout:** The system uses ML to calculate risk and credits the worker's wallet instantly—**no claims process needed.**

---

##  2. Weekly Premium & Parametric Model
### Why Weekly?
Delivery workers have a weekly payout cycle. A small, non-binding **Weekly Premium (e.g., ₹49)** is affordable, easy to manage, and can be paused or resumed based on seasonal needs.

### Parametric Triggers
Payouts are triggered by *verifiable data*, not claims:
-   **Rainfall:** Intensity exceeds 10mm in a 4-hour window.
-   **Hazardous Wind:** Sustained speeds > 50km/h.
-   **Extreme Heat:** Temperature > 42°C for 2 consecutive hours.

### Platform Choice: Web vs Mobile
We have chosen a **Responsive Web Application (React/Vite)** for the MVP because:
-   **Zero Friction:** No app store downloads required; accessible via a simple link in delivery WhatsApp groups.
-   **Platform Agnostic:** Works on any budget smartphone used by workers.
-   **Speed:** Faster iteration cycle during the hackathon.

---

##  3. AI/ML Integration Strategy
RainShield moves beyond static data with predictive intelligence:
-   **Dynamic Premium Calculation:** AI adjusts weekly premiums based on 10-year historical weather patterns for specifically localized zones.
-   **Risk Prediction:** Scikit-learn models predict "Earnings Loss" by correlating Rainfall (mm) with Time-of-Day (e.g., rain during dinner peak = higher loss).
-   **Fraud Detection:** Cross-referencing weather data with anonymized worker GPS pings to verify the user was in the affected area during the event.

---

##  4. Tech Stack & Development Plan
### Tech Stack
-   **Frontend:** React.js + Vite (Fast, Premium Responsive UI).
-   **Backend:** Node.js + Express (Scalable Event Processing).
-   **Database:** MongoDB (Flexible User/History storage).
-   **ML Layer:** Python + Flask (Scikit-learn for risk assessment).
-   **Data:** OpenWeatherMap API for real-time parametric data.

### Execution Plan
-   **Phase 1:** Core Ideation & Foundation (Complete).
-   **Phase 2:** Building the Prototype (Static Triggers + User Dashboards).
-   **Phase 3:** ML Integration & Automated Payout Simulation.

---

##  5. Why it matters? (Relevant Extras)
RainShield provides **Financial Resilience** to the most vulnerable participants of the digital economy. It transforms insurance from a "grudge purchase" into a "functional tool" for survival in a climate-uncertain world.

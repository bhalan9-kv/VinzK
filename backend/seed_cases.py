"""Seed 95+ cases into MongoDB. Run with: python -m backend.seed_cases"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

import motor.motor_asyncio
from datetime import datetime, timezone

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "case_interviewer"

CASES = [
    # ── PROFITABILITY (18 cases) ──
    {"title": "Declining Profits at GreenGrocer", "company": "GreenGrocer Inc.", "type": "profitability", "difficulty": "easy",
     "context": "GreenGrocer, a mid-size organic grocery chain with 45 stores, has seen profits drop 15% over the past year despite flat revenues. The CEO wants to understand why.",
     "exhibits": [{"title": "Revenue & Cost Breakdown", "data": {"revenues_2025": "$1.2B", "revenues_2024": "$1.21B", "cogs": {"2025": "$780M", "2024": "$750M"}, "opex": {"2025": "$310M", "2024": "$290M"}, "net_income": {"2025": "$110M", "2024": "$170M"}}},
                  {"title": "Store Performance", "data": {"top_quartile_stores_margin": "12%", "bottom_quartile_stores_margin": "-3%", "new_stores_last_year": 8, "closed_stores": 0, "avg_lease_cost_increase": "18%"}}],
     "questions": ["Which cost category grew the most?", "Are new stores cannibalizing existing ones?", "What happened to supplier costs?"]},

    {"title": "AutoParts Global Margin Squeeze", "company": "AutoParts Global", "type": "profitability", "difficulty": "medium",
     "context": "AutoParts Global, a Tier-1 automotive supplier, has seen EBITDA margins fall from 14% to 8% over three years. Revenues grew 12% in the same period.",
     "exhibits": [{"title": "Segment P&L", "data": {"OEM_segment": {"revenue": "$4.2B", "margin": "6%"}, "aftermarket_segment": {"revenue": "$1.8B", "margin": "15%"}, "raw_materials_inflation": "22%", "labor_cost_increase": "15%", "capex_last_3y": "$800M"}},
                  {"title": "Customer Concentration", "data": {"top_5_customers": "68% of revenue", "price_contracts": "2-3 year fixed", "volume_decreases": "Customer 3: -12%, Customer 5: -8%"}}],
     "questions": ["How do fixed-price contracts interact with material inflation?", "Which segment drives the margin decline?", "Is the capex generating returns?"]},

    {"title": "NovaTech SaaS Profitability Crisis", "company": "NovaTech", "type": "profitability", "difficulty": "medium",
     "context": "NovaTech is a B2B SaaS company with $200M ARR. Despite 40% YoY revenue growth, they are burning $80M/year. The board wants a path to profitability.",
     "exhibits": [{"title": "Unit Economics", "data": {"CAC": "$45,000", "LTV": "$120,000", "payback_period_months": 18, "gross_margin": "72%", "net_revenue_retention": "110%", "logo_churn": "8% annually"}}],
     "questions": ["Which cost categories are growing fastest?", "Is the growth rate sustainable?", "What's the LTV:CAC ratio trend?"]},

    {"title": "Pacific Hotels Revenue Drop", "company": "Pacific Hotels Group", "type": "profitability", "difficulty": "easy",
     "context": "Pacific Hotels operates 32 boutique hotels across the West Coast. RevPAR has declined 20% in 18 months while operating costs remain elevated.",
     "exhibits": [{"title": "Key Metrics", "data": {"revpar_decline": "20%", "occupancy_rate": "62% (was 78%)", "avg_daily_rate": "$185 (was $195)", "operating_cost_per_room": "$110 (was $105)", "new_competitors_nearby": 6}}],
     "questions": ["Is the problem occupancy or rate?", "How do competitor rates compare?", "Which cost line items are fixed vs variable?"]},

    {"title": "MedSupply Chain Profitability", "company": "MedSupply Chain", "type": "profitability", "difficulty": "hard",
     "context": "MedSupply Chain distributes medical supplies to 2,000+ hospitals. Gross margins have compressed from 35% to 22% while volume increased 30%.",
     "exhibits": [{"title": "Margin Waterfall", "data": {"gross_margin_2023": "35%", "gross_margin_2025": "22%", "volume_growth": "30%", "avg_order_size": "$2,400 (was $3,100)", "freight_costs": "+45%", "returns_rate": "12% (was 5%)", "private_label_mix": "8% (was 2%)"}}],
     "questions": ["Are smaller orders driving freight inefficiency?", "Is private label margin dilutive?", "What's happening with returns?"]},

    {"title": "CloudServe Infrastructure Costs", "company": "CloudServe", "type": "profitability", "difficulty": "medium",
     "context": "CloudServe, a cloud infrastructure startup, has costs growing 3x faster than revenue. They have 18 months of runway.",
     "exhibits": [{"title": "Cost Structure", "data": {"revenue_mrr": "$2.5M", "cloud_compute_costs": "$1.8M/mo", "engineering_headcount": 120, "avg_engineer_salary": "$185K", "customer_support_cost": "$400K/mo", "customer_count": 340}}],
     "questions": ["What's the revenue per customer vs cost to serve?", "Is compute cost proportional to usage?", "Can engineering costs be optimized?"]},

    {"title": "FreshBite Unit Economics", "company": "FreshBite", "type": "profitability", "difficulty": "easy",
     "context": "FreshBite is a meal-kit delivery service with 500K subscribers. The company is profitable in 3 states but losing money in 12 others.",
     "exhibits": [{"title": "State-Level P&L", "data": {"profitable_states": ["CA", "NY", "TX"], "avg_margin_profitable": "8%", "avg_margin_unprofitable": "-15%", "delivery_cost_per_box": {"profitable": "$4.20", "unprofitable": "$8.90"}, "subscriber_density": {"profitable": "15K/sq mi", "unprofitable": "3K/sq mi"}}}],
     "questions": ["Is density the key driver?", "What's the breakeven subscriber density?", "Can logistics be regionalized?"]},

    {"title": "BrewCo Cost Escalation", "company": "BrewCo Craft Brewery", "type": "profitability", "difficulty": "medium",
     "context": "BrewCo has seen ingredient costs rise 40% but only raised prices 10%. Margins are evaporating.",
     "exhibits": [{"title": "Cost Analysis", "data": {"ingredients_cost_per_barrel": "$85 (was $60)", "packaging_cost_per_barrel": "$22 (was $20)", "distribution_cost_per_barrel": "$18 (was $16)", "price_per_keg": "$180 (was $165)", "volume_last_12m": "stable"}}],
     "questions": ["Which ingredient has the biggest increase?", "Can the product mix shift to higher-margin SKUs?", "Is the price increase below market rate?"]},

    {"title": "Telecom Italia Margin Decline", "company": "Telecom Italia", "type": "profitability", "difficulty": "hard",
     "context": "Telecom Italia's operating margin dropped from 28% to 16% over 4 years despite market share gains.",
     "exhibits": [{"title": "4-Year Trend", "data": {"revenue_cagr": "3%", "opex_cagr": "11%", "subscriber_growth": "+25%", "arpu_trend": "-8%", "network_investment": "$12B over 4 years", "regulatory_fees": "+60%"}}],
     "questions": ["Is subscriber growth at the expense of ARPU?", "Is the network investment driving efficiency?", "How do regulatory costs compare to peers?"]},

    {"title": "SolarFlow Profitability", "company": "SolarFlow Energy", "type": "profitability", "difficulty": "medium",
     "context": "SolarFlow installs residential solar panels. Installation volume grew 50% but profits dropped 30%.",
     "exhibits": [{"title": "Unit Economics", "data": {"avg_install_cost": "$28,000", "avg_revenue_per_install": "$32,000", "warranty_cost_per_install_5yr": "$3,200 (was $1,800)", "install_time_days": "3.5 (was 2.8)", "permit_rejection_rate": "18% (was 8%)", "install_crew_utilization": "72%"}}],
     "questions": ["Are warranty costs related to panel quality?", "Is permitting bottlenecks reducing throughput?", "What's the trend in per-install margin?"]},

    {"title": "PrintCo Decline", "company": "PrintCo Publishing", "type": "profitability", "difficulty": "easy",
     "context": "PrintCo, a textbook publisher, faces declining revenue as universities shift to digital. Costs remain high due to print infrastructure.",
     "exhibits": [{"title": "Revenue Mix", "data": {"print_revenue": "$400M (was $550M)", "digital_revenue": "$120M (was $40M)", "printing_facilities": "3 plants at 45% capacity", "headcount": "2,200 (was 2,500)", "digital_margin": "85%", "print_margin": "15%"}}],
     "questions": ["What's the digital growth trajectory?", "Can print facilities be consolidated?", "Is the workforce sized for the digital shift?"]},

    {"title": "LuxAir Fleet Costs", "company": "LuxAir", "type": "profitability", "difficulty": "hard",
     "context": "LuxAir, a luxury regional airline, has fuel costs consuming 35% of revenue (industry avg: 25%). The CEO wants a turnaround.",
     "exhibits": [{"title": "Cost Benchmarks", "data": {"fuel_cost_pct_revenue": "35%", "industry_avg": "25%", "fleet_age_years": "14 (industry: 8)", "fuel_efficiency_l_per_100km": "5.8 (newer: 3.2)", "maintenance_cost_per_flight_hr": "$2,400 (industry: $1,800)", "load_factor": "71% (industry: 82%)"}}],
     "questions": ["Is fleet age the primary cost driver?", "Can load factor be improved?", "What's the ROI on fleet renewal?"]},

    {"title": "GreenLeaf Organics Margin Problem", "company": "GreenLeaf Organics", "type": "profitability", "difficulty": "medium",
     "context": "GreenLeaf, an organic food distributor, grew revenue 25% but net income turned negative for the first time.",
     "exhibits": [{"title": "Growth vs Profitability", "data": {"revenue_growth": "+25%", "warehouse_expansion": "+40% sq footage", "new_hires": 85, "customer_acquisition_cost": "$12K (was $6K)", "avg_customer_revenue": "$48K/yr", "customer_churn": "22% (was 12%)"}}],
     "questions": ["Is growth too fast for the infrastructure?", "What's driving the CAC increase?", "Is customer churn canceling out acquisition?"]},

    {"title": "AeroParts Manufacturing", "company": "AeroParts Manufacturing", "type": "profitability", "difficulty": "hard",
     "context": "AeroParts makes precision aerospace components. Revenues are flat but scrap rates have doubled, eating into margins.",
     "exhibits": [{"title": "Quality & Cost Data", "data": {"scrap_rate": "8% (was 4%)", "rework_cost": "$2.2M/quarter", "machine_age_avg": "18 years", "defect_categories": {"dimensional": 45%, "surface": 30%, "material": 25%"}, "customer_penalties_last_year": "$4.5M"}}],
     "questions": ["Are defects related to machine age?", "Which product lines have highest scrap?", "What's the cost of inaction vs capex?"]},

    {"title": "StyleHub Margin Compression", "company": "StyleHub", "type": "profitability", "difficulty": "medium",
     "context": "StyleHub, an online fashion marketplace, has margins compressing as they invest in fast fashion to compete with Shein.",
     "exhibits": [{"title": "Margin Trend", "data": {"take_rate": "18% (was 22%)", "returns_rate": "35% (was 20%)", "avg_order_value": "$45 (was $65)", "marketing_spend_pct": "28% (was 18%)", "seller_count": "+200%", "avg_seller_revenue": "$800/mo (was $2,200)"}}],
     "questions": ["Is the marketplace quality diluting?", "How do returns compare to competitors?", "Is the marketing spend sustainable?"]},

    {"title": "CurePharma R&D Costs", "company": "CurePharma", "type": "profitability", "difficulty": "hard",
     "context": "CurePharma's R&D spending as % of revenue increased from 15% to 32% while new drug approvals remained flat.",
     "exhibits": [{"title": "R&D Efficiency", "data": {"rd_spend_2023": "$1.2B", "rd_spend_2025": "$2.8B", "ndas_filed": 4, "ndas_approved": 2, "avg_cost_per_approved_drug": "$1.4B (industry: $1.1B)", "pipeline_drugs": 34, "phase_3_failures_last_3y": 5}}],
     "questions": ["Are late-stage failures driving cost?", "How does the pipeline efficiency compare to peers?", "Is the increase in spending proportional to pipeline value?"]},

    {"title": "UrbanBite Delivery Losses", "company": "UrbanBite", "type": "profitability", "difficulty": "easy",
     "context": "UrbanBite, a food delivery platform in 8 cities, loses $3 per order on average despite 100K daily deliveries.",
     "exhibits": [{"title": "Per-Order Economics", "data": {"avg_order_value": "$28", "commission_rate": "22%", "avg_delivery_fee_charged": "$3.50", "driver_cost_per_delivery": "$6.80", "platform_cost_per_order": "$1.20", "refund_rate": "8%"}}],
     "questions": ["What's the breakeven commission rate?", "Can delivery density reduce driver costs?", "Is the refund rate normal?"]},

    {"title": "DataFlow Analytics Costs", "company": "DataFlow Analytics", "type": "profitability", "difficulty": "medium",
     "context": "DataFlow's costs tripled after acquiring a competitor but the revenue synergies haven't materialized.",
     "exhibits": [{"title": "Post-Acquisition", "data": {"pre_acq_revenue": "$80M", "post_acq_revenue": "$95M (target: $120M)", "duplicated_roles": 45, "tech_stack_overlap": "60%", "integration_cost_ytd": "$12M", "key_talent_departed": 18}}],
     "questions": ["How much cost redundancy exists?", "What's the timeline for synergy realization?", "Is talent loss impacting revenue?"]},

    # ── MARKET ENTRY (15 cases) ──
    {"title": "CloudPay Enters India", "company": "CloudPay", "type": "market_entry", "difficulty": "medium",
     "context": "CloudPay, a US payroll SaaS company, wants to enter the Indian market where 60M+ SMEs need digital payroll solutions.",
     "exhibits": [{"title": "Market Data", "data": {"india_smes": "63M", "digital_payroll_penetration": "12%", "total_addressable_market": "$4.2B", "existing_competitors": 8, "top_competitor_market_share": "35%", "avg_revenue_per_sme_in_usd": "$240/yr"}}],
     "questions": ["What's the willingness to pay?", "How do Indian regulatory requirements differ?", "Is a local partner needed?"]},

    {"title": "EcoWear Launches in Japan", "company": "EcoWear", "type": "market_entry", "difficulty": "hard",
     "context": "EcoWear, a sustainable fashion brand from Scandinavia, wants to enter the Japanese market.",
     "exhibits": [{"title": "Japan Fashion Market", "data": {"market_size": "$85B", "sustainable_fashion_share": "4%", "growth_rate": "18% annually", "key_channels": ["department stores (40%)", "online (30%)", "boutiques (20%)", "outlets (10%)"], "import_regulations": "Textile labeling act compliance required"}}],
     "questions": ["What's the cultural fit for Scandinavian sustainability messaging?", "Which channel is best for entry?", "What compliance is required?"]},

    {"title": "FitTech Enters Brazil", "company": "FitTech", "type": "market_entry", "difficulty": "medium",
     "context": "FitTech, a fitness app with 5M US users, wants to expand to Brazil — the world's second-largest fitness market.",
     "exhibits": [{"title": "Brazil Fitness Market", "data": {"market_size": "$5.8B", "smartphone_penetration": "82%", "avg_willingness_to_pay_monthly": "$4.50 (vs $15 US)", "top_local_competitors": 3, "gym_penetration": "12% (US: 21%)", "internet_speed_ranking": "77th globally"}}],
     "questions": ["How does the lower WTP affect the business model?", "Is the app optimized for slower internet?", "What localization is needed?"]},

    {"title": "SwiftLogistics to Southeast Asia", "company": "SwiftLogistics", "type": "market_entry", "difficulty": "hard",
     "context": "SwiftLogistics, a US last-mile delivery company, wants to enter Southeast Asia starting with Indonesia.",
     "exhibits": [{"title": "Indonesia Market", "data": {"population": "280M", "e_commerce_growth": "30% annually", "current_logistics_players": 15, "avg_delivery_time": "5-7 days", "infrastructure_score": "3.2/10 (last-mile)", "cod_percentage": "65%"}}],
     "questions": ["Can the model work with 65% COD?", "How does archipelago geography affect operations?", "What's the entry mode — build or acquire?"]},

    {"title": "MediView Enters UK", "company": "MediView", "type": "market_entry", "difficulty": "medium",
     "context": "MediView, a US telemedicine platform, wants to enter the UK through the NHS partnership model.",
     "exhibits": [{"title": "UK Telehealth", "data": {"nhs_wait_times_avg": "18 weeks", "telehealth_adoption": "22% post-covid", "private_healthcare_spending": "$45B/yr", "regulatory_body": "NHS England + CQC", "data_protection": "UK GDPR + NHS DSPT"}}],
     "questions": ["What's the NHS procurement process?", "How does NHS data protection differ from HIPAA?", "Is the private market an alternative entry point?"]},

    {"title": "BrightEdu to Africa", "company": "BrightEdu", "type": "market_entry", "difficulty": "hard",
     "context": "BrightEdu, an edtech platform, wants to enter the African market starting with Kenya and Nigeria.",
     "exhibits": [{"title": "Africa Edtech", "data": {"youth_population_15_24": "420M", "smartphone_penetration_nigeria": "55%", "internet_penetration_kenya": "42%", "avg_willingness_to_pay": "$2/month", "existing_edtech_funding": "$600M", "literacy_rate_gap": "25% below global avg"}}],
     "questions": ["How does ultra-low WTP affect the business model?", "Can the app work offline?", "What partnerships are essential?"]},

    {"title": "PetPal Enters Germany", "company": "PetPal", "type": "market_entry", "difficulty": "easy",
     "context": "PetPal, a pet care marketplace app from the US, wants to enter Germany — Europe's largest pet market.",
     "exhibits": [{"title": "Germany Pet Market", "data": {"market_size": "$8.2B", "pet_ownership": "47% of households", "avg_spend_per_pet": "$1,200/yr", "online_pet_services_penetration": "18%", "key_competitors": ["Tiergesundheit.de (42% share)", "PetsDelight (22%)"]}}],
     "questions": ["How does the market structure compare to the US?", "What localization is needed?", "Is acquisition of a local player faster?"]},

    {"title": "CleanEnergy to Australia", "company": "CleanEnergy Solutions", "type": "market_entry", "difficulty": "medium",
     "context": "CleanEnergy Solutions, a solar installation company from California, wants to enter Australia where solar adoption is booming.",
     "exhibits": [{"title": "Australia Solar", "data": {"household_solar_penetration": "33%", "annual_installations": "3.2GW", "avg_system_cost": "$5,800 AUD", "government_rebate": "30% STC discount", "competitor_count": 500+, "avg_customer_acquisition_cost": "$800 AUD"}}],
     "questions": ["How saturated is the installer market?", "What's the competitive advantage needed?", "How does regulation differ from California?"]},

    {"title": "FoodieApp to Middle East", "company": "FoodieApp", "type": "market_entry", "difficulty": "hard",
     "context": "FoodieApp, a food review and reservation platform, wants to enter UAE and Saudi Arabia.",
     "exhibits": [{"title": "Middle East F&B Digital", "data": {"uae_fnb_market": "$32B", "delivery_app_penetration": "65%", "reservation_platform_penetration": "15%", "avg_restaurant_reviews_per_month": 200, "key_local_competitor": "Zomato UAE (40% share)"}}],
     "questions": ["Is reservation the right entry wedge given low penetration?", "How does the competitive landscape differ?", "What cultural factors affect the product?"]},

    {"title": "RoboFarm Enters Netherlands", "company": "RoboFarm", "type": "market_entry", "difficulty": "medium",
     "context": "RoboFarm makes autonomous farming robots and wants to enter the Netherlands, Europe's agtech hub.",
     "exhibits": [{"title": "Netherlands Agtech", "data": {"agricultural_land": "1.8M hectares", "farm_count": "55K", "avg_farm_size": "33 hectares", "labor_cost_per_hour": "€22", "robot_penetration": "8%", "government_agtech_subsidy": "30% of cost"}}],
     "questions": ["How does farm size affect ROI calculations?", "Can the subsidy be leveraged for market entry?", "What crop types are best suited?"]},

    {"title": "Zenith Fitness to Mexico", "company": "Zenith Fitness", "type": "market_entry", "difficulty": "easy",
     "context": "Zenith Fitness, a premium gym chain, wants to enter Mexico City.",
     "exhibits": [{"title": "Mexico Fitness", "data": {"gym_penetration": "6% (US: 21%)", "premium_gym_avg_monthly": "$55", "middle_class_growth": "4% annually", "city_population": "22M metro", "existing_premium_chains": 3, "occupancy_rate_of_existing": "72%"}}],
     "questions": ["Is there unmet premium demand?", "What pricing strategy works for the income distribution?", "Where should the first location be?"]},

    {"title": "CyberShield to Europe", "company": "CyberShield", "type": "market_entry", "difficulty": "hard",
     "context": "CyberShield, a US cybersecurity firm, wants to expand into the EU market post-DORA regulation.",
     "exhibits": [{"title": "EU Cybersecurity Market", "data": {"market_size": "$42B", "dora_compliance_deadline": "Jan 2025", "companies_needing_compliance": "12,000+", "existing_eu_players": 45, "avg_contract_value": "$350K/yr", "data_residency_requirement": "Yes"}}],
     "questions": ["Which EU country should be the hub?", "How does DORA drive demand?", "What's the data residency strategy?"]},

    {"title": "NutriBox to Canada", "company": "NutriBox", "type": "market_entry", "difficulty": "easy",
     "context": "NutriBox, a healthy snack subscription service, wants to expand from the US to Canada.",
     "exhibits": [{"title": "Canada Snack Market", "data": {"health_snack_growth": "12% annually", "subscription_box_penetration": "8%", "cross_border_shipping_cost": "+40% vs domestic", "food_regulations": "CFIA compliance required", "avg_canadian_health_spend": "$85/month"}}],
     "questions": ["Does shipping cost destroy unit economics?", "What CFIA changes are needed?", "Is there a cross-border fulfillment partner?"]},

    {"title": "SmartHome to Nordic", "company": "SmartHome Co.", "type": "market_entry", "difficulty": "medium",
     "context": "SmartHome Co. makes IoT home devices and wants to enter the Nordic market (Sweden, Norway, Denmark, Finland).",
     "exhibits": [{"title": "Nordic IoT Market", "data": {"smart_home_penetration": "38% (global: 18%)", "energy_efficiency_priority": "#1 consumer concern", "average_income": "$55K", "tech_adoption_index": "92/100", "data_privacy_sensitivity": "Very High"}}],
     "questions": ["How does privacy sensitivity affect IoT?", "Can energy efficiency be the primary value prop?", "What certifications are needed?"]},

    {"title": "GreenTransport to India", "company": "GreenTransport", "type": "market_entry", "difficulty": "hard",
     "context": "GreenTransport, an EV fleet operator, wants to enter India's ride-hailing market.",
     "exhibits": [{"title": "India EV Market", "data": {"ride_hailing_market": "$12B", "ev_penetration_in_fleet": "2%", "charging_infrastructure": "1 station per 15 km", "avg_ev_range_km": 200, "gov_ev_subsidy": "15% of vehicle cost", "battery_cost_trend": "-12% annually"}}],
     "questions": ["Is charging infrastructure sufficient?", "How does EV range match average ride distance?", "What's the total cost of ownership vs ICE?"]},

    # ── GTM (15 cases) ──
    {"title": "NeoCRM Go-to-Market", "company": "NeoCRM", "type": "gtm", "difficulty": "medium",
     "context": "NeoCRM launched a new AI-powered CRM but is struggling to find product-market fit. They have 200 paying customers out of 5,000 trial users.",
     "exhibits": [{"title": "Funnel Metrics", "data": {"trial_signups": 5000, "activated_users": 3200, "paid_conversion": 200, "trial_to_paid_rate": "4%", "industry_avg": "15%", "avg_deal_size": "$180/yr", "churn_after_month_1": "35%", "nps_score": 22}}],
     "questions": ["Where is the biggest drop-off?", "Why is activation not converting?", "How does churn compare to competitors?"]},

    {"title": "Artisan Marketplace Launch", "company": "ArtisanHub", "type": "gtm", "difficulty": "easy",
     "context": "ArtisanHub is a marketplace connecting artisans with buyers. They have 500 sellers but only 200 monthly buyers.",
     "exhibits": [{"title": "Marketplace Metrics", "data": {"sellers": 500, "monthly_buyers": 200, "avg_order_value": "$45", "seller_retention_3mo": "40%", "buyer_retention_3mo": "15%", "organic_traffic": "80%", "marketing_spend": "$2K/mo"}}],
     "questions": ["Is the supply-demand imbalance the problem?", "Why are buyers not returning?", "What's the organic growth channel?"]},

    {"title": "PaySimple Enterprise Push", "company": "PaySimple", "type": "gtm", "difficulty": "hard",
     "context": "PaySimple, a SMB payment processor, wants to move upmarket to enterprise clients ($10M+ revenue companies).",
     "exhibits": [{"title": "Current vs Target", "data": {"current_customers": "15K SMBs", "avg_contract": "$5K/yr", "enterprise_leads_generated": 45, "enterprise_deals_closed": 2, "avg_enterprise_deal": "$120K/yr", "sales_cycle_months": 8, "enterprise_win_rate": "4%"}}],
     "questions": ["What's missing in the enterprise value proposition?", "Is the sales team equipped for enterprise?", "What features need development?"]},

    {"title": "LearnFast B2B Expansion", "company": "LearnFast", "type": "gtm", "difficulty": "medium",
     "context": "LearnFast, a consumer learning app with 2M users, wants to launch a B2B corporate training product.",
     "exhibits": [{"title": "B2B Opportunity", "data": {"corporate_training_market": "$380B", "existing_b2b_competitors": 25, "avg_per_learner_price": "$200/yr", "target_company_size": "500-5000 employees", "content_library_size": "500 courses", "consumer_nps": 68}}],
     "questions": ["Does the content library meet enterprise needs?", "What sales motion works for mid-market L&D?", "How does pricing compare to incumbents?"]},

    {"title": "WanderLens Travel Platform", "company": "WanderLens", "type": "gtm", "difficulty": "easy",
     "context": "WanderLens is a travel planning app launching in 3 months. They need a go-to-market strategy with a $500K budget.",
     "exhibits": [{"title": "Market Context", "data": {"target_market": "millennials旅行", "total_addressable_market": "$20B", "existing_apps": 15, "budget": "$500K", "time_to_launch": "3 months", "unique_feature": "AI itinerary generator", "team_size": 12"}}],
     "questions": ["What's the launch channel strategy?", "How to differentiate from existing apps?", "What metrics matter at launch?"]},

    {"title": "FreshFarm D2C Launch", "company": "FreshFarm", "type": "gtm", "difficulty": "medium",
     "context": "FreshFarm, an organic farm cooperative, wants to launch a direct-to-consumer subscription box.",
     "exhibits": [{"title": "D2C Feasibility", "data": {"farm_coop_members": 45, "current_wholesale_revenue": "$8M/yr", "d2c_price_premium": "40%", "target_market_size": "200K households within 100mi", "competitor_d2c_boxes": 8, "avg_competitor_price": "$55/week"}}],
     "questions": ["What's the logistics model?", "Can supply match demand volatility?", "What's the customer acquisition strategy?"]},

    {"title": "CodeSprint Developer Platform", "company": "CodeSprint", "type": "gtm", "difficulty": "hard",
     "context": "CodeSprint, a developer assessment tool, wants to pivot from SMB to mid-market and enterprise.",
     "exhibits": [{"title": "Segment Analysis", "data": {"current_smb_pricing": "$99/mo", "enterprise_pricing": "$2,500/mo", "smb_win_rate": "22%", "enterprise_win_rate": "6%", "avg_smb_churn": "5%/mo", "enterprise_churn": "1%/mo", "enterprise_features_missing": ["SSO", "custom assessments", "API access", "SLA"]}}],
     "questions": ["Is the product ready for enterprise?", "What's the sales motion difference?", "Can SMB fund the pivot?"]},

    {"title": "GreenGadget Pre-Order Campaign", "company": "GreenGadget", "type": "gtm", "difficulty": "easy",
     "context": "GreenGadget, an eco-friendly electronics maker, is launching a new solar-powered phone charger and planning a pre-order campaign.",
     "exhibits": [{"title": "Product Launch", "data": {"retail_price": "$79", "preorder_discount": "20%", "target_units": "50K", "production_cost": "$22", "marketing_budget": "$150K", "social_following": "180K", "media_coverage": "3 tech blogs committed"}}],
     "questions": ["Is the pre-order discount cannibalizing margin?", "What channels drive the most pre-orders?", "How does unit cost scale with volume?"]},

    {"title": "MedTech Clinical Sales", "company": "MedTech Solutions", "type": "gtm", "difficulty": "hard",
     "context": "MedTech Solutions has a diagnostic device that reduces lab results time by 60%. They struggle to sell to hospitals.",
     "exhibits": [{"title": "Sales Pipeline", "data": {"total_addressable_hospitals": 5200, "hospitals_contacted": 800, "demos_completed": 120, "pilots_started": 35, "pilots_converted": 5, "avg_device_price": "$85K", "annual_reagent_revenue": "$25K/device", "sales_cycle_months": 14}}],
     "questions": ["Where is the pipeline leaking?", "Is the ROI story compelling enough?", "Who is the economic buyer?"]},

    {"title": "TeleHealth Provider Network", "company": "TeleHealth+", "type": "gtm", "difficulty": "medium",
     "context": "TeleHealth+ has a telemedicine platform but only 200 doctors on the network across 5 specialties.",
     "exhibits": [{"title": "Provider Network", "data": {"doctors_on_platform": 200, "patient_wait_time": "48 hours (target: 4 hours)", "avg_consultation_revenue": "$75", "doctor_payout": "70%", "specialties_covered": 5, "specialties_needed": 15, "patient_satisfaction": "3.8/5"}}],
     "questions": ["Is the doctor incentive model competitive?", "What's the supply acquisition strategy?", "Which specialty should expand first?"]},

    {"title": "EduPlay Gamification Platform", "company": "EduPlay", "type": "gtm", "difficulty": "easy",
     "context": "EduPlay gamifies K-12 learning. They have a great product but only 12 school district partnerships.",
     "exhibits": [{"title": "B2B EdTech Sales", "data": {"school_districts_targeted": 500, "demos_given": 80, "pilots_launched": 12, "pilot_to_contract_rate": "25%", "avg_annual_contract": "$15K", "district_size_avg": "8K students", "longest_sales_cycle": "18 months"}}],
     "questions": ["Is the pilot-to-contract rate the bottleneck?", "What's the procurement process?", "Can teachers drive adoption?"]},

    {"title": "WellnessCo Subscription Tiers", "company": "WellnessCo", "type": "gtm", "difficulty": "medium",
     "context": "WellnessCo has a wellness app with 100K free users and 5K paid subscribers. They want to optimize the conversion funnel.",
     "exhibits": [{"title": "Conversion Funnel", "data": {"free_users": 100000, "free_to_trial": "8%", "trial_to_paid": "15%", "paid_monthly": "$12.99", "paid_annual": "$99.99", "annual_adoption": "40%", "monthly_churn": "6%", "features_most_used": ["meditation (80%)", "sleep (45%)", "workout (30%)"]}}],
     "questions": ["What's driving the free-to-trial gap?", "Should pricing tiers be restructured?", "Can popular features unlock conversion?"]},

    {"title": "FinTrack SMB Marketing", "company": "FinTrack", "type": "gtm", "difficulty": "hard",
     "context": "FinTrack, a financial analytics tool, is shifting from enterprise-only to also targeting SMBs. They need a new marketing strategy.",
     "exhibits": [{"title": "Marketing Analysis", "data": {"enterprise_cac": "$8,500", "enterprise_ltv": "$180K", "enterprise_ltv_cac": "21x", "smb_target_cac": "$200", "smb_target_ltv": "$2,400", "content_marketing_team": 2, "paid_budget": "$200K/mo", "current_channels": ["sales-led outbound"]}}],
     "questions": ["What marketing channels work for SMB?", "Can content marketing replace sales-led for SMB?", "How do you avoid enterprise cannibalization?"]},

    {"title": "CloudKit Partner Strategy", "company": "CloudKit", "type": "gtm", "difficulty": "medium",
     "context": "CloudKit, a cloud storage provider, wants to build a channel partner program to scale distribution.",
     "exhibits": [{"title": "Channel Opportunity", "data": {"current_direct_revenue": "$30M", "partner_contribution": "$2M (5 resellers)", "partner_program_cost": "$1.5M", "target_partners_yr1": 50, "avg_partner_revenue": "$400K/yr", "partner_incentive_rate": "15%", "self_serve_comparison": "lower margin but scalable"}}],
     "questions": ["What types of partners are most valuable?", "Is the incentive rate competitive?", "How does partner quality scale?"]},

    {"title": "GameVault Influencer Strategy", "company": "GameVault", "type": "gtm", "difficulty": "easy",
     "context": "GameVault, an indie game discovery platform, wants to use influencer marketing as its primary growth channel.",
     "exhibits": [{"title": "Influencer Market", "data": {"gaming_content_creators": "12M globally", "micro_influencer_rate": "$500/post", "macro_influencer_rate": "$8K/post", "target_demo": "18-34 gamers", "platform_focus": ["YouTube (45%)", "Twitch (30%)", "TikTok (25%)"], "current_installs": "50K", "target_installs_6mo": "500K"}}],
     "questions": ["What's the cost per install target?", "Which influencer tier gives best ROI?", "How do you track attribution?"]},

    # ── DD/M&A (12 cases) ──
    {"title": "MegaCorp Acquires TechStart", "company": "MegaCorp", "type": "dd_ma", "difficulty": "medium",
     "context": "MegaCorp, a Fortune 500 conglomerate, is considering acquiring TechStart, a Series C AI startup, for $800M.",
     "exhibits": [{"title": "Target Financials", "data": {"revenue": "$60M ARR", "growth_rate": "120% YoY", "gross_margin": "78%", "burn_rate": "$8M/mo", "cash_on_hand": "$120M", "employees": 340, "key客户": ["3 enterprise logos = 40% revenue"], "tech_stack": "proprietary ML models, 15 patents"}}],
     "questions": ["Is the $800M valuation justified?", "What are the key integration risks?", "How concentrated is the customer base?"]},

    {"title": "HealthCo Pharma Merger", "company": "HealthCo", "type": "dd_ma", "difficulty": "hard",
     "context": "HealthCo is merging with PharmaPlus in a $4.2B deal. The boards want a synergy assessment.",
     "exhibits": [{"title": "Synergy Analysis", "data": {"revenue_synergies": {"cross_sell": "$200M/yr", "pricing_power": "$80M/yr"}, "cost_synergies": {"rd_consolidation": "$350M/yr", "manufacturing": "$150M/yr", "corporate_g&a": "$100M/yr"}, "one_time_integration_cost": "$800M", "overlap_therapeutic_areas": 4, "patent_expirations_next_3yr": 6}}],
     "questions": ["Are the synergy estimates realistic?", "What's the NPV of synergies vs deal premium?", "What are the regulatory risks?"]},

    {"title": "RetailMax Store Acquisition", "company": "RetailMax", "type": "dd_ma", "difficulty": "easy",
     "context": "RetailMax wants to acquire 15 underperforming stores from a bankrupt competitor for $25M.",
     "exhibits": [{"title": "Target Stores", "data": {"total_stores": 15, "avg_revenue_per_store": "$4.2M", "avg_store_sqft": "12,000", "lease_remaining_years": 5, "avg_lease_per_sqft": "$18", "headcount_per_store": 25, "estimated_remodel_cost": "$500K/store"}}],
     "questions": ["Can these stores be turned around?", "What's the all-in cost including remodel?", "What's the revenue potential post-acquisition?"]},

    {"title": "FinServ Insurance Acquisition", "company": "FinServ Holdings", "type": "dd_ma", "difficulty": "hard",
     "context": "FinServ wants to acquire InsureTech, a digital insurance startup, for $1.2B to accelerate digital transformation.",
     "exhibits": [{"title": "InsureTech Metrics", "data": {"premiums_written": "$800M", "loss_ratio": "62%", "combined_ratio": "95%", "digital_ratio": "70% (vs FinServ's 15%)", "technology_platform": "cloud-native, microservices", "regulatory_licenses": 38, "pending_claims": "$120M"}}],
     "questions": ["What's the technology integration plan?", "How do the regulatory profiles align?", "Is the combined ratio sustainable?"]},

    {"title": "MediaGroup Publisher Acquisition", "company": "MediaGroup", "type": "dd_ma", "difficulty": "medium",
     "context": "MediaGroup is acquiring DigitalVoice, a programmatic advertising company, for $350M.",
     "exhibits": [{"title": "DigitalVoice Financials", "data": {"revenue": "$120M", "revenue_growth": "35%", "gross_margin": "45%", "ebitda_margin": "8%", "top_3_advertiser_concentration": "45%", "data_assets": "300M user profiles", "privacy_compliance": "GDPR, CCPA"}}],
     "questions": ["Is the data asset the primary value driver?", "How fragile is advertiser concentration?", "What's the privacy risk?"]},

    {"title": "LogiCorp Warehouse Acquisition", "company": "LogiCorp", "type": "dd_ma", "difficulty": "easy",
     "context": "LogiCorp wants to acquire 8 warehouses from a distressed logistics company for $120M to expand their distribution network.",
     "exhibits": [{"title": "Warehouse Portfolio", "data": {"total_warehouses": 8, "total_sqft": "2.4M", "occupancy_rate": "65%", "avg_lease_cost": "$8/sqft", "market_rate": "$12/sqft", "locations": ["LA (2)", "Chicago (2)", "Dallas (2)", "Atlanta (2)"], "automation_level": "None"}}],
     "questions": ["Can occupancy be improved?", "What's the automation ROI?", "Are locations strategically valuable?"]},

    {"title": "DataCo Analytics Merger", "company": "DataCo", "type": "dd_ma", "difficulty": "hard",
     "context": "DataCo and InsightPro, two mid-size data analytics companies, are considering a merger of equals valued at $2B each.",
     "exhibits": [{"title": "Combined Entity", "data": {"combined_revenue": "$1.8B", "product_overlap": "40%", "customer_overlap": "15%", "combined_headcount": 4500, "duplicate_roles": 600, "tech_debt_assessment": "High for both", "board_composition": "8 from DataCo, 6 from InsightPro"}}],
     "questions": ["How do you resolve the governance structure?", "What's the integration risk for a merger of equals?", "Where do cost savings come from?"]},

    {"title": "GreenPower Utility Acquisition", "company": "GreenPower", "type": "dd_ma", "difficulty": "medium",
     "context": "GreenPower is acquiring SolarField, a solar farm operator, for $600M to accelerate its renewable energy transition.",
     "exhibits": [{"title": "SolarField Assets", "data": {"total_capacity_mw": 450, "operating_farms": 12, "ppa_contracts_remaining_years": "12-18", "avg_ppa_price_per_mwh": "$42", "levelized_cost": "$35/mwh", "maintenance_cost_per_mw": "$15K/yr", "land_ownership": "60% owned, 40% leased"}}],
     "questions": ["Is the PPA portfolio priced fairly?", "What's the land lease risk?", "How do maintenance costs trend?"]},

    {"title": "EduPlatform Acquisition", "company": "EduPlatform Inc.", "type": "dd_ma", "difficulty": "medium",
     "context": "EduPlatform wants to acquire LearnHub, a K-12 learning management system, for $180M.",
     "exhibits": [{"title": "LearnHub Metrics", "data": {"schools_served": 3200, "students_on_platform": 2.8M, "arr": "$45M", "net_revenue_retention": "105%", "avg_contract_value": "$14K", "support_cost_per_school": "$2K/yr", "churn_rate": "12%"}}],
     "questions": ["Is the churn rate acceptable?", "What's the cross-sell opportunity?", "How sticky is the platform?"]},

    {"title": "FoodChain Restaurant Group", "company": "FoodChain", "type": "dd_ma", "difficulty": "easy",
     "context": "FoodChain is acquiring BistroBliss, a chain of 40 fast-casual restaurants, for $80M.",
     "exhibits": [{"title": "BistroBliss Financials", "data": {"locations": 40, "avg_revenue_per_location": "$1.8M", "food_cost_pct": "32%", "labor_cost_pct": "28%", "rent_cost_pct": "12%", "avg_location_sqft": "2800", "lease_remaining": "7 years avg"}}],
     "questions": ["Which locations are profitable?", "What's the labor model efficiency?", "Are there real estate opportunities?"]},

    {"title": "CyberSec Platform Acquisition", "company": "CyberSec Group", "type": "dd_ma", "difficulty": "hard",
     "context": "CyberSec Group is acquiring ThreatGuard, an AI-powered threat detection company, for $500M.",
     "exhibits": [{"title": "ThreatGuard Analysis", "data": {"arr": "$80M", "growth": "90% YoY", "gross_margin": "82%", "customers": 450, "avg_contract_value": "$178K", "detection_accuracy": "97.5%", "false_positive_rate": "2.1%", "key_patents": 8, "employee_stock_options_owed": "$120M"}}],
     "questions": ["How do you value the IP and patents?", "What's the retention risk for key engineers?", "Is the growth rate sustainable?"]},

    {"title": "LuxuryBrand Acquisition", "company": "LuxuryBrand Holdings", "type": "dd_ma", "difficulty": "medium",
     "context": "LuxuryBrand Holdings is acquiring MaisonElite, a niche luxury fragrance company, for $200M.",
     "exhibits": [{"title": "MaisonElite Profile", "data": {"revenue": "$55M", "ebitda_margin": "18%", "top_product": "40% of revenue", "distribution": {"own_boutiques": 12, "department_stores": 200, "online": "15%"}, "brand_awareness_in_target_demo": "8%", "social_media_following": "500K"}}],
     "questions": ["How dependent is the brand on one product?", "Can distribution be expanded?", "What's the brand equity valuation?"]},

    # ── GUESSTIMATE (12 cases) ──
    {"title": "How Many Gas Stations in the US?", "company": "N/A", "type": "guesstimate", "difficulty": "easy",
     "context": "Estimate the total number of gas stations in the United States.",
     "exhibits": [],
     "questions": ["How many cars are there?", "How often do they refuel?", "What's the throughput per station?"]},

    {"title": "Market Size for Electric Scooter Charging", "company": "N/A", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate the total addressable market for e-scooter charging infrastructure in a major US city.",
     "exhibits": [],
     "questions": ["How many scooters are there?", "What's the charging frequency?", "What's the per-charge revenue?"]},

    {"title": "How Many Tennis Balls Fit in a School Bus?", "company": "N/A", "type": "guesstimate", "difficulty": "easy",
     "context": "How many tennis balls can you fit inside a standard American school bus?",
     "exhibits": [],
     "questions": ["What are the bus dimensions?", "What's a tennis ball's diameter?", "How much packing efficiency?"]},

    {"title": "Revenue of a Times Square Billboard", "company": "N/A", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate the annual revenue of a prime billboard location in Times Square, New York City.",
     "exhibits": [],
     "questions": ["How many eyeballs per day?", "What's the CPM rate?", "How many advertisers rotate?"]},

    {"title": "US Wedding Industry Market Size", "company": "N/A", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate the total annual market size of the US wedding industry.",
     "exhibits": [],
     "questions": ["How many weddings per year?", "What's the average spend?", "What categories of spending?"]},

    {"title": "How Many Pipelines in the US?", "company": "N/A", "type": "guesstimate", "difficulty": "hard",
     "context": "Estimate the total miles of oil and gas pipelines in the United States.",
     "exhibits": [],
     "questions": ["How many refineries?", "How far do they transport?", "What about distribution vs transmission?"]},

    {"title": "Daily Uber Rides in NYC", "company": "N/A", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate the number of Uber rides completed daily in New York City.",
     "exhibits": [],
     "questions": ["How many registered drivers?", "What's the utilization rate?", "How does it compare to taxis?"]},

    {"title": "Number of Starbucks in the World", "company": "N/A", "type": "guesstimate", "difficulty": "easy",
     "context": "How many Starbucks locations exist worldwide? (No looking it up!)",
     "exhibits": [],
     "questions": ["How many countries?", "What's the density per major city?", "How does the US compare to international?"]},

    {"title": "Market for Pet Food Delivery", "company": "N/A", "type": "guesstimate", "difficulty": "hard",
     "context": "Estimate the annual market size for pet food delivery services in the United States.",
     "exhibits": [],
     "questions": ["How many pet-owning households?", "What % would use delivery?", "What's the average order value?"]},

    {"title": "Number of ATMs in India", "company": "N/A", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate the total number of ATMs operating in India.",
     "exhibits": [],
     "questions": ["How many banks?", "Urban vs rural distribution?", "What's the per-bank ATM ratio?"]},

    {"title": "Revenue of Spotify per User", "company": "N/A", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate Spotify's revenue per user per month, including both free and premium.",
     "exhibits": [],
     "questions": ["What's the premium vs free split?", "What's ad revenue per free user?", "What's the subscription price?"]},

    {"title": "Airplane Passengers per Day Globally", "company": "N/A", "type": "guesstimate", "difficulty": "hard",
     "context": "Estimate the number of airline passengers carried globally per day.",
     "exhibits": [],
     "questions": ["How many flights per day?", "What's the average aircraft capacity?", "What's the average load factor?"]},

    # ── UNCONVENTIONAL (10 cases) ──
    {"title": "Should Amazon Open Restaurants?", "company": "Amazon", "type": "unconventional", "difficulty": "hard",
     "context": "Should Amazon acquire or build a chain of physical fast-casual restaurants?",
     "exhibits": [{"title": "Strategic Analysis", "data": {"amazon_fresh_stores": 44, "whole_foods_stores": 500, "us_fcas_market": "$250B", "amazon_prime_members": "200M", "delivery_infrastructure": "nationwide", "restaurant_industry_margins": "3-6%"}}],
     "questions": ["What strategic advantage does Amazon have?", "How do thin margins fit Amazon's model?", "What would be the competitive moat?"]},

    {"title": "Airline Loyalty NFT Program", "company": "SkyHigh Airlines", "type": "unconventional", "difficulty": "medium",
     "context": "Should SkyHigh Airlines replace its traditional frequent flyer program with an NFT-based loyalty system?",
     "exhibits": [{"title": "Current Program", "data": {"members": "45M", "annual_cost": "$2.8B", "partner_redemptions": "35%", "breakage_rate": "20%", "nft_market_trend": "declining 60% from peak", "crypto_adoption_in_target_demo": "12%"}}],
     "questions": ["What problem does NFT solve that traditional doesn't?", "What's the risk to the existing $2.8B program?", "Is the technology ready?"]},

    {"title": "Hospital as Hotel", "company": "MedStay Health", "type": "unconventional", "difficulty": "medium",
     "context": "MedStay Health wants to convert underutilized hospital wings into premium recovery suites that feel like luxury hotels.",
     "exhibits": [{"title": "Concept Analysis", "data": {"average_hospital_stay": "4.5 days", "hotel_room_equivalent_cost": "$350/night", "hospital_room_cost": "$2,800/night", "patient_satisfaction_in_hospital": "62%", "willingness_to_pay_premium": "40% would pay $500/night", "regulatory_clearance_needed": "Moderate"}}],
     "questions": ["Can clinical care be maintained in a hotel-like setting?", "What's the regulatory pathway?", "How does this affect insurance coverage?"]},

    {"title": "Museum as Co-Working Space", "company": "CultureHub", "type": "unconventional", "difficulty": "easy",
     "context": "CultureHub proposes turning underperforming museum galleries into premium co-working spaces during weekday mornings.",
     "exhibits": [{"title": "Feasibility Study", "data": {"museum_avg_weekday_visitors": 200, "museum_avg_weekend_visitors": 2000, "empty_gallery_hours_per_week": 35, "co_working_price_per_day": "$45", "potential_desks": 150, "original_artwork_relocation_cost": "$200K"}}],
     "questions": ["Can art and work coexist safely?", "What's the insurance model?", "How do members feel about the environment?"]},

    {"title": "Subscription Funeral Services", "company": "EverAfter", "type": "unconventional", "difficulty": "hard",
     "context": "EverAfter wants to disrupt the funeral industry with a subscription model — pay monthly for life, and your funeral is covered.",
     "exhibits": [{"title": "Market Analysis", "data": {"us_funeral_market": "$20B", "avg_funeral_cost": "$8,000", "cremation_rate": "58% and rising", "subscription_price_proposed": "$25/month", "customer_lifetime_estimated": "30 years", "traditional_pre_need_sales": "$3B"}}],
     "questions": ["Is the unit economics viable?", "How does this compare to pre-need insurance?", "What's the churn risk before death?"]},

    {"title": "Reverse Amazon — Manufacturing Marketplace", "company": "MakeIt", "type": "unconventional", "difficulty": "hard",
     "context": "MakeIt wants to be 'Amazon for custom manufacturing' — customers describe what they want, and factories bid to make it.",
     "exhibits": [{"title": "Market Opportunity", "data": {"custom_manufacturing_market": "$150B", "current_online_penetration": "5%", "avg_order_size": "$5,000", "avg_lead_time": "6 weeks", "buyer_pain_points": ["price transparency", "quality assurance", "communication"]}}],
     "questions": ["How do you ensure quality at scale?", "What's the matching algorithm?", "How does this differ from existing RFQ platforms?"]},

    {"title": "Competitive Eating League", "company": "FoodBattle", "type": "unconventional", "difficulty": "easy",
     "context": "FoodBattle wants to create a professional competitive eating league with sponsorships and media deals.",
     "exhibits": [{"title": "Sports Entertainment", "data": {"current_eating_competition_prize": "$10K", "esports_league_revenue": "$1.2B", "mukbang_views_monthly": "500M", "sponsor_interest": "3 CPG brands interested", "media_platform": "YouTube + Twitch", "target_audience": "18-34 males"}}],
     "questions": ["Is there a sustainable revenue model?", "How does this compare to esports as entertainment?", "What's the sponsorship pitch?"]},

    {"title": "AI Therapist vs Human", "company": "MindBridge", "type": "unconventional", "difficulty": "hard",
     "context": "MindBridge wants to launch an AI-powered therapy platform that's 90% cheaper than human therapists. Ethical and business analysis needed.",
     "exhibits": [{"title": "Therapy Market", "data": {"us_therapy_market": "$15B", "avg_session_cost": "$150", "therapist_shortage": "30% unmet demand", "ai_therapy_proposed_cost": "$15/session", "current_ai_mental_health_apps": 8, "clinical_trial_results": "65% as effective as CBT for mild anxiety"}}],
     "questions": ["What are the ethical boundaries?", "How does this compare to existing apps?", "What's the regulatory landscape?"]},

    {"title": "Space Tourism for the Middle Class", "company": "SpaceVoyage", "type": "unconventional", "difficulty": "hard",
     "context": "SpaceVoyage aims to make suborbital space tourism affordable at $5,000 per seat within 5 years.",
     "exhibits": [{"title": "Space Tourism Economics", "data": {"current_price_per_seat": "$450K (Blue Origin)", "target_price": "$5K", "current_customer_count": 24, "engineering_development_cost": "$2B", "projected_passengers_per_year_at_5K": "50,000", "safety_incident_tolerance": "1 in 100K", "current_track_record": "1 in 24 incidents"}}],
     "questions": ["Can costs decrease that dramatically?", "What's the safety roadmap?", "How does demand scale with price?"]},

    {"title": "Gamified Tax Preparation", "company": "TaxQuest", "type": "unconventional", "difficulty": "medium",
     "context": "TaxQuest wants to gamify tax preparation — users earn rewards and compete on leaderboards for filing early and accurately.",
     "exhibits": [{"title": "Tax Prep Market", "data": {"diy_tax_prep_market": "$8B", "avg_refund": "$3,100", "early_filer_percentage": "25%", "gamification_in_fintech_engagement": "+40%", "tax_prep_time_avg": "8 hours", "error_rate_diy": "12%"}}],
     "questions": ["Does gamification actually improve tax behavior?", "What's the reward mechanism?", "How does this compete with TurboTax?"]},

    # ── ADDITIONAL TYPES ──
    {"title": "Revenue Growth at DataPulse", "company": "DataPulse", "type": "revenues", "difficulty": "medium",
     "context": "DataPulse, a data analytics consultancy, wants to grow revenue from $25M to $50M in 3 years.",
     "exhibits": [{"title": "Revenue Analysis", "data": {"current_revenue": "$25M", "revenue_by_type": {"project_work": "60%", "retainer": "25%", "training": "15%"}, "avg_project_size": "$180K", "avg_retainer": "$15K/mo", "sales_team": 8, "win_rate": "22%", "utilization_rate": "72%"}}],
     "questions": ["Which revenue lever has most upside?", "Can the sales team scale?", "Should the revenue mix shift?"]},

    {"title": "Cost Reduction at FactoryCo", "company": "FactoryCo", "type": "cost_reduction", "difficulty": "medium",
     "context": "FactoryCo, a manufacturing company, needs to reduce operating costs by 20% to remain competitive.",
     "exhibits": [{"title": "Cost Breakdown", "data": {"labor": "35% of costs", "materials": "30%", "energy": "15%", "maintenance": "10%", "overhead": "10%", "automation_level": "Low", "energy_source": "100% grid", "shift_pattern": "2 shifts, 5 days"}}],
     "questions": ["Where is the biggest cost reduction opportunity?", "Can automation provide ROI?", "How does energy procurement compare?"]},

    {"title": "Growth Strategy for HealthTech", "company": "HealthTech Pro", "type": "growth", "difficulty": "hard",
     "context": "HealthTech Pro, a patient management platform, is growing 20% YoY but the board wants 40%.",
     "exhibits": [{"title": "Growth Analysis", "data": {"arr": "$40M", "current_growth": "20% YoY", "target_growth": "40%", "product_lines": {"emr_integration": "$20M", "telehealth": "$12M", "analytics": "$8M"}, "sales_efficiency": "1.2x", "market_penetration": "4%", "nps": 55}}],
     "questions": ["Which product line can grow fastest?", "What's the market expansion opportunity?", "Is sales efficiency the constraint?"]},

    {"title": "Pricing Strategy for DevTool", "company": "DevTool Inc.", "type": "pricing", "difficulty": "medium",
     "context": "DevTool Inc. is a developer productivity tool with 50K users. Current pricing: $0 (free) / $29/mo (pro). Revenue is below potential.",
     "exhibits": [{"title": "Pricing Analysis", "data": {"free_users": 48000, "pro_users": 2000, "conversion_rate": "4%", "willingness_to_pay_survey": {"$29": "35% of free users", "$49": "22%", "$79": "8%"}, "feature_usage": {"core_features": "95%", "advanced_features": "30%", "team_features": "12%"}}}],
     "questions": ["Is the conversion rate a pricing or product problem?", "Should there be more tiers?", "How do team features change the model?"]},

    {"title": "Reducing Customer Churn at StreamCo", "company": "StreamCo", "type": "customer_satisfaction", "difficulty": "medium",
     "context": "StreamCo, a streaming analytics platform, has 8% monthly churn — double the industry average.",
     "exhibits": [{"title": "Churn Analysis", "data": {"monthly_churn": "8%", "industry_avg": "4%", "churn_by_tenure": {"month_1": "20%", "months_2-3": "12%", "months_4-6": "5%", "6_plus": "2%"}, "top_churn_reasons": ["not using advanced features (35%)", "too complex (28%)", "pricing (22%)", "competitor_switch (15%)"], "nps": 32}}],
     "questions": ["Is the onboarding the primary problem?", "How does the product complexity compare to competitors?", "Can usage-based pricing reduce churn?"]},

    {"title": "Market Sizing: Dog Walking App", "company": "PawWalk", "type": "guesstimate", "difficulty": "medium",
     "context": "Estimate the annual market size for a dog walking app in the United States.",
     "exhibits": [],
     "questions": ["How many dog-owning households?", "What % would use a walker?", "What's the average spend?"]},

    {"title": "M&A: EdTech Roll-Up", "company": "EduHoldings", "type": "dd_ma", "difficulty": "hard",
     "context": "EduHoldings is acquiring three small edtech companies to create an integrated K-12 platform. Total deal: $300M.",
     "exhibits": [{"title": "Target Companies", "data": {"company_a": {"product": "LMS", "arr": "$25M", "customers": "1,200 schools"}, "company_b": {"product": "Assessment", "arr": "$15M", "customers": "800 schools"}, "company_c": {"product": "Communication", "arr": "$10M", "customers": "3,000 schools"}, "overlap": "15% of customers use 2+ products", "integration_timeline": "18 months"}}],
     "questions": ["What's the cross-sell opportunity?", "How does integration risk compare to standalone value?", "What's the combined entity worth?"]},

    {"title": "Logistics Optimization for E-Commerce", "company": "ShipFast", "type": "cost_reduction", "difficulty": "hard",
     "context": "ShipFast, an e-commerce logistics provider, needs to cut delivery costs 25% while maintaining 2-day shipping.",
     "exhibits": [{"title": "Logistics Cost Drivers", "data": {"last_mile_cost_per_package": "$5.20", "warehouse_cost_per_order": "$1.80", "average_distance_to_customer": "850 miles", "current_warehouses": 4, "delivery_partners": 3, "return_rate": "18%"}}],
     "questions": ["Can warehouse placement reduce distance?", "Is the return rate addressable?", "How do delivery partners compare on cost?"]},

    {"title": "Subscription Revenue at MedLearn", "company": "MedLearn", "type": "revenues", "difficulty": "easy",
     "context": "MedLearn, a medical education platform, wants to transition from per-course pricing to a subscription model.",
     "exhibits": [{"title": "Current Model", "data": {"courses_available": 500, "avg_course_price": "$299", "annual_purchasers": "15K", "repeat_purchase_rate": "30%", "market_avg_sub_price": "$49/mo", "total_addressable_users": "500K"}}],
     "questions": ["How does lifetime value compare across models?", "What's the break-even conversion rate?", "How does the content library affect willingness to subscribe?"]},

    {"title": "Growth for Sustainable CPG", "company": "EcoGoods", "type": "growth", "difficulty": "medium",
     "context": "EcoGoods, a sustainable household products brand, sells through Whole Foods and wants to double revenue in 2 years.",
     "exhibits": [{"title": "Growth Levers", "data": {"current_revenue": "$18M", "channels": {"whole_foods": "55%", "direct_to_consumer": "25%", "other_retail": "20%"}, "product_lines": ["cleaning (60%)", "personal care (25%)", "home (15%)"], "repeat_rate": "45%", "social_media_following": "120K", "certifications": ["B Corp", "Leaping Bunny", "USDA Organic"]}}],
     "questions": ["Which channel has most upside?", "Should product line expand?", "How do certifications drive premium pricing?"]},

    {"title": "Pricing a New AI Feature", "company": "SaaSify", "type": "pricing", "difficulty": "hard",
     "context": "SaaSify, a project management tool, has built an AI assistant feature and needs to price it.",
     "exhibits": [{"title": "AI Feature Analysis", "data": {"cost_per_user_per_month": "$2.50", "current_plans": {"free": "$0", "pro": "$12/mo", "business": "$24/mo"}, "usage_prediction": {"heavy_users": "20%", "medium_users": "40%", "light_users": "40%"}, "competitor_ai_add_on": "$10-15/mo", "willingness_to_pay_survey": "$8/mo avg"}}],
     "questions": ["Should it be an add-on or bundled?", "How do usage tiers affect cost?", "What's the competitive positioning?"]},

    {"title": "NPS Recovery for CloudHost", "company": "CloudHost", "type": "customer_satisfaction", "difficulty": "hard",
     "context": "CloudHost, a cloud hosting provider, saw NPS drop from 52 to 18 after a major outage.",
     "exhibits": [{"title": "Customer Impact", "data": {"nps_before": 52, "nps_current": 18, "outage_duration": "14 hours", "affected_customers": "35%", "churn_post_outage": "8%", "support_tickets": "+400%", "competitor_migration": "12% of affected customers", "sla_credit_paid": "$2.4M"}}],
     "questions": ["What's the recovery timeline?", "How do you win back churned customers?", "What structural changes prevent recurrence?"]},
]


async def seed():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    col = db["cases"]

    existing = await col.count_documents({})
    if existing > 0:
        print(f"Database already has {existing} cases. Skipping seed.")
        return

    for c in CASES:
        c["created_at"] = datetime.now(timezone.utc)

    result = await col.insert_many(CASES)
    print(f"Seeded {len(result.inserted_ids)} cases into MongoDB.")


if __name__ == "__main__":
    asyncio.run(seed())

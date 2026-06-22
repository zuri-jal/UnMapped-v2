from typing import Optional

from fastapi import HTTPException

from services.nlp_service import extract_locations, split_compound_location
from services.openai_service import resolve_country_to_city, select_cities_for_country

# Hardcoded country → default city fallback (used when OpenAI returns nothing)
COUNTRY_TO_CITY: dict[str, str] = {
    "indonesia": "Bali",
    "japan": "Tokyo",
    "thailand": "Bangkok",
    "india": "Delhi",
    "vietnam": "Ho Chi Minh City",
    "malaysia": "Kuala Lumpur",
    "philippines": "Manila",
    "nepal": "Kathmandu",
    "sri lanka": "Colombo",
    "united arab emirates": "Dubai",
    "uae": "Dubai",
    "turkey": "Istanbul",
    "egypt": "Cairo",
    "australia": "Sydney",
    "new zealand": "Auckland",
    "south africa": "Johannesburg",
    "brazil": "Sao Paulo",
    "mexico": "Mexico City",
    "greece": "Athens",
    "south korea": "Seoul",
}

_KNOWN_COUNTRIES = set(COUNTRY_TO_CITY.keys())

# Reverse lookup: city name (lowercase) → country name (title-case)
# Covers the cities most commonly mentioned in travel planning.
CITY_TO_COUNTRY: dict[str, str] = {
    # Vietnam
    "hanoi": "Vietnam", "ho chi minh city": "Vietnam", "saigon": "Vietnam",
    "da nang": "Vietnam", "hoi an": "Vietnam", "hue": "Vietnam",
    "nha trang": "Vietnam", "phu quoc": "Vietnam", "can tho": "Vietnam",
    "ha long bay": "Vietnam", "halong bay": "Vietnam",
    # Thailand
    "bangkok": "Thailand", "chiang mai": "Thailand", "phuket": "Thailand",
    "pattaya": "Thailand", "koh samui": "Thailand", "koh phi phi": "Thailand",
    "chiang rai": "Thailand", "hua hin": "Thailand", "krabi": "Thailand",
    "kanchanaburi": "Thailand", "ayutthaya": "Thailand",
    # Indonesia
    "bali": "Indonesia", "jakarta": "Indonesia", "yogyakarta": "Indonesia",
    "surabaya": "Indonesia", "lombok": "Indonesia", "ubud": "Indonesia",
    "seminyak": "Indonesia", "kuta": "Indonesia", "medan": "Indonesia",
    "bandung": "Indonesia", "makassar": "Indonesia", "komodo": "Indonesia",
    # Malaysia
    "kuala lumpur": "Malaysia", "penang": "Malaysia", "langkawi": "Malaysia",
    "kota kinabalu": "Malaysia", "malacca": "Malaysia", "melaka": "Malaysia",
    "ipoh": "Malaysia", "johor bahru": "Malaysia",
    # Philippines
    "manila": "Philippines", "cebu": "Philippines", "palawan": "Philippines",
    "boracay": "Philippines", "davao": "Philippines", "el nido": "Philippines",
    "coron": "Philippines", "siargao": "Philippines",
    # Singapore
    "singapore": "Singapore",
    # Myanmar
    "yangon": "Myanmar", "mandalay": "Myanmar", "bagan": "Myanmar",
    "inle lake": "Myanmar",
    # Cambodia
    "siem reap": "Cambodia", "phnom penh": "Cambodia", "sihanoukville": "Cambodia",
    # Laos
    "luang prabang": "Laos", "vientiane": "Laos", "pakse": "Laos",
    # Sri Lanka
    "colombo": "Sri Lanka", "kandy": "Sri Lanka", "galle": "Sri Lanka",
    "sigiriya": "Sri Lanka", "ella": "Sri Lanka", "trincomalee": "Sri Lanka",
    # India
    "delhi": "India", "new delhi": "India", "mumbai": "India", "bombay": "India",
    "bangalore": "India", "bengaluru": "India", "chennai": "India",
    "kolkata": "India", "calcutta": "India", "jaipur": "India", "goa": "India",
    "agra": "India", "varanasi": "India", "hyderabad": "India",
    "kochi": "India", "cochin": "India", "mysore": "India",
    "udaipur": "India", "jodhpur": "India", "rishikesh": "India",
    "amritsar": "India", "pushkar": "India", "hampi": "India",
    # Nepal
    "kathmandu": "Nepal", "pokhara": "Nepal", "chitwan": "Nepal",
    # Japan
    "tokyo": "Japan", "osaka": "Japan", "kyoto": "Japan", "hiroshima": "Japan",
    "nara": "Japan", "sapporo": "Japan", "fukuoka": "Japan", "nagoya": "Japan",
    "yokohama": "Japan", "kobe": "Japan", "nikko": "Japan", "hakone": "Japan",
    "kamakura": "Japan", "kanazawa": "Japan", "nagasaki": "Japan",
    # South Korea
    "seoul": "South Korea", "busan": "South Korea", "incheon": "South Korea",
    "jeju": "South Korea", "gyeongju": "South Korea", "gangwon": "South Korea",
    # China
    "beijing": "China", "shanghai": "China", "guangzhou": "China",
    "shenzhen": "China", "chengdu": "China", "xian": "China", "xi'an": "China",
    "guilin": "China", "zhangjiajie": "China", "hangzhou": "China",
    "suzhou": "China", "chongqing": "China", "kunming": "China",
    "lijiang": "China", "lhasa": "China",
    # Taiwan
    "taipei": "Taiwan", "tainan": "Taiwan", "kaohsiung": "Taiwan",
    "taichung": "Taiwan", "hualien": "Taiwan",
    # Hong Kong
    "hong kong": "Hong Kong",
    # UAE
    "dubai": "UAE", "abu dhabi": "UAE", "sharjah": "UAE",
    # Qatar
    "doha": "Qatar",
    # Jordan
    "amman": "Jordan", "petra": "Jordan", "aqaba": "Jordan",
    # Israel
    "tel aviv": "Israel", "jerusalem": "Israel", "haifa": "Israel", "eilat": "Israel",
    # Turkey
    "istanbul": "Turkey", "ankara": "Turkey", "antalya": "Turkey",
    "izmir": "Turkey", "bodrum": "Turkey", "cappadocia": "Turkey",
    "nevsehir": "Turkey", "trabzon": "Turkey", "pamukkale": "Turkey",
    # Georgia (country)
    "tbilisi": "Georgia", "batumi": "Georgia", "kutaisi": "Georgia",
    # Armenia
    "yerevan": "Armenia",
    # Azerbaijan
    "baku": "Azerbaijan",
    # Iceland
    "reykjavik": "Iceland", "akureyri": "Iceland",
    # Morocco
    "marrakech": "Morocco", "casablanca": "Morocco", "fez": "Morocco",
    "fes": "Morocco", "rabat": "Morocco", "essaouira": "Morocco",
    "tangier": "Morocco", "chefchaouen": "Morocco",
    # Egypt
    "cairo": "Egypt", "luxor": "Egypt", "aswan": "Egypt",
    "alexandria": "Egypt", "sharm el-sheikh": "Egypt", "hurghada": "Egypt",
    # Kenya
    "nairobi": "Kenya", "mombasa": "Kenya",
    # Tanzania
    "dar es salaam": "Tanzania", "zanzibar": "Tanzania", "arusha": "Tanzania",
    # South Africa
    "cape town": "South Africa", "johannesburg": "South Africa",
    "durban": "South Africa", "pretoria": "South Africa",
    "stellenbosch": "South Africa", "kruger": "South Africa",
    # France
    "paris": "France", "lyon": "France", "marseille": "France", "nice": "France",
    "bordeaux": "France", "toulouse": "France", "strasbourg": "France",
    "nantes": "France", "mont saint-michel": "France", "versailles": "France",
    # UK
    "london": "UK", "edinburgh": "UK", "manchester": "UK", "birmingham": "UK",
    "bristol": "UK", "liverpool": "UK", "glasgow": "UK", "bath": "UK",
    "oxford": "UK", "cambridge": "UK", "york": "UK", "cardiff": "UK",
    # Germany
    "berlin": "Germany", "munich": "Germany", "hamburg": "Germany",
    "frankfurt": "Germany", "cologne": "Germany", "dresden": "Germany",
    "heidelberg": "Germany", "stuttgart": "Germany", "nuremberg": "Germany",
    "dusseldorf": "Germany", "düsseldorf": "Germany", "bremen": "Germany",
    "rothenburg": "Germany",
    # Italy
    "rome": "Italy", "milan": "Italy", "florence": "Italy", "venice": "Italy",
    "naples": "Italy", "turin": "Italy", "bologna": "Italy", "verona": "Italy",
    "palermo": "Italy", "amalfi": "Italy", "cinque terre": "Italy", "pisa": "Italy",
    "siena": "Italy", "lake como": "Italy", "taormina": "Italy",
    # Spain
    "barcelona": "Spain", "madrid": "Spain", "seville": "Spain",
    "valencia": "Spain", "granada": "Spain", "bilbao": "Spain",
    "san sebastian": "Spain", "malaga": "Spain", "toledo": "Spain",
    "cordoba": "Spain", "salamanca": "Spain", "ibiza": "Spain",
    # Portugal
    "lisbon": "Portugal", "porto": "Portugal", "faro": "Portugal",
    "braga": "Portugal", "sintra": "Portugal", "coimbra": "Portugal",
    "funchal": "Portugal", "madeira": "Portugal",
    # Netherlands
    "amsterdam": "Netherlands", "rotterdam": "Netherlands",
    "the hague": "Netherlands", "utrecht": "Netherlands", "haarlem": "Netherlands",
    # Belgium
    "brussels": "Belgium", "bruges": "Belgium", "ghent": "Belgium",
    "antwerp": "Belgium",
    # Switzerland
    "zurich": "Switzerland", "geneva": "Switzerland", "bern": "Switzerland",
    "lausanne": "Switzerland", "interlaken": "Switzerland",
    "lucerne": "Switzerland", "zermatt": "Switzerland", "lugano": "Switzerland",
    # Austria
    "vienna": "Austria", "salzburg": "Austria", "innsbruck": "Austria",
    "graz": "Austria", "hallstatt": "Austria",
    # Czech Republic
    "prague": "Czech Republic", "brno": "Czech Republic",
    "cesky krumlov": "Czech Republic",
    # Hungary
    "budapest": "Hungary",
    # Poland
    "warsaw": "Poland", "krakow": "Poland", "gdansk": "Poland",
    "wroclaw": "Poland",
    # Greece
    "athens": "Greece", "santorini": "Greece", "mykonos": "Greece",
    "thessaloniki": "Greece", "crete": "Greece", "rhodes": "Greece",
    "corfu": "Greece", "meteora": "Greece",
    # Croatia
    "dubrovnik": "Croatia", "zagreb": "Croatia", "split": "Croatia",
    "hvar": "Croatia", "plitvice": "Croatia",
    # Ireland
    "dublin": "Ireland", "cork": "Ireland", "galway": "Ireland",
    # Denmark
    "copenhagen": "Denmark",
    # Norway
    "oslo": "Norway", "bergen": "Norway", "tromso": "Norway",
    # Sweden
    "stockholm": "Sweden", "gothenburg": "Sweden", "malmo": "Sweden",
    # Finland
    "helsinki": "Finland", "rovaniemi": "Finland",
    # Romania
    "bucharest": "Romania", "brasov": "Romania", "cluj-napoca": "Romania",
    # Slovenia
    "ljubljana": "Slovenia", "bled": "Slovenia",
    # USA
    "new york": "USA", "new york city": "USA", "nyc": "USA",
    "los angeles": "USA", "la": "USA", "chicago": "USA",
    "san francisco": "USA", "miami": "USA", "las vegas": "USA",
    "new orleans": "USA", "seattle": "USA", "washington dc": "USA",
    "washington d.c.": "USA", "boston": "USA", "atlanta": "USA",
    "denver": "USA", "austin": "USA", "portland": "USA", "honolulu": "USA",
    "nashville": "USA", "philadelphia": "USA", "san diego": "USA",
    "phoenix": "USA", "houston": "USA", "dallas": "USA",
    "savannah": "USA", "charleston": "USA", "key west": "USA",
    "orlando": "USA", "hawaii": "USA", "maui": "USA",
    # Canada
    "toronto": "Canada", "vancouver": "Canada", "montreal": "Canada",
    "calgary": "Canada", "ottawa": "Canada", "quebec city": "Canada",
    "banff": "Canada", "whistler": "Canada", "victoria": "Canada",
    # Mexico
    "mexico city": "Mexico", "cancun": "Mexico", "guadalajara": "Mexico",
    "oaxaca": "Mexico", "playa del carmen": "Mexico", "tulum": "Mexico",
    "cabo san lucas": "Mexico", "puerto vallarta": "Mexico",
    "merida": "Mexico", "mérida": "Mexico",
    # Brazil
    "sao paulo": "Brazil", "são paulo": "Brazil",
    "rio de janeiro": "Brazil", "rio": "Brazil",
    "salvador": "Brazil", "florianopolis": "Brazil",
    "recife": "Brazil", "fortaleza": "Brazil", "manaus": "Brazil",
    # Argentina
    "buenos aires": "Argentina", "mendoza": "Argentina",
    "bariloche": "Argentina", "salta": "Argentina", "ushuaia": "Argentina",
    "cordoba": "Argentina",
    # Chile
    "santiago": "Chile", "valparaiso": "Chile", "san pedro de atacama": "Chile",
    # Peru
    "lima": "Peru", "cusco": "Peru", "cuzco": "Peru",
    "arequipa": "Peru", "machu picchu": "Peru",
    # Colombia
    "bogota": "Colombia", "bogotá": "Colombia", "medellin": "Colombia",
    "medellín": "Colombia", "cartagena": "Colombia", "cali": "Colombia",
    # Costa Rica
    "san jose": "Costa Rica", "manuel antonio": "Costa Rica",
    "arenal": "Costa Rica", "tamarindo": "Costa Rica",
    # Cuba
    "havana": "Cuba", "trinidad": "Cuba", "varadero": "Cuba",
    # Australia
    "sydney": "Australia", "melbourne": "Australia", "brisbane": "Australia",
    "perth": "Australia", "adelaide": "Australia", "cairns": "Australia",
    "gold coast": "Australia", "darwin": "Australia", "hobart": "Australia",
    # New Zealand
    "auckland": "New Zealand", "wellington": "New Zealand",
    "christchurch": "New Zealand", "queenstown": "New Zealand",
    "rotorua": "New Zealand", "dunedin": "New Zealand",
}


def lookup_country(city_name: str) -> str:
    """Return the country for a known city name, or '' if not found."""
    return CITY_TO_COUNTRY.get(city_name.lower().strip(), "")


def distribute_days(total_days: int, num_cities: int) -> list[int]:
    """Distribute total_days across num_cities as evenly as possible, front-loading the remainder."""
    base = total_days // num_cities
    remainder = total_days % num_cities
    return [base + (1 if i < remainder else 0) for i in range(num_cities)]


def extract_country(location_str: str) -> str:
    """Parse country from a 'City, Country' location string."""
    parts = location_str.split(",", 1)
    return parts[1].strip() if len(parts) > 1 else ""


async def detect_cities(
    user_message: str,
    destination: Optional[str],
    origin: Optional[str],
    duration_days: int,
) -> tuple[list[str], list[int], str | None]:
    """
    Case 1/2/3 city detection — shared between /plan and /resolve-cities.

    Case 1: single named city  → one city, all days
    Case 2: multiple named cities → each city, days distributed evenly
    Case 3: country-only input  → OpenAI selects 2-3 cities for that country

    Returns (city_names, day_counts, country_name).
    country_name is non-None only for Case 3 (a country, not city, was the input).
    Raises HTTPException(400) if no destination can be determined.
    """
    nlp_locations = extract_locations(user_message)

    locations = list(nlp_locations)
    if destination and destination not in locations:
        locations.insert(0, destination)

    dest_locs = [loc for loc in locations if not origin or loc.lower() != origin.lower()]

    country_name: str | None = None
    city_names: list[str] = []

    if destination:
        raw = destination
        if raw.lower() in _KNOWN_COUNTRIES:
            country_name = raw        # Case 3: explicit country override
        else:
            city_names = split_compound_location(raw)   # split "Bali and Yogyakarta" → ['Bali', 'Yogyakarta']
    elif len(dest_locs) >= 2:
        city_names = dest_locs        # Case 2: multiple NLP-detected cities
    elif len(dest_locs) == 1:
        single = dest_locs[0]
        if single.lower() in _KNOWN_COUNTRIES:
            country_name = single     # Case 3: single country from NLP
        else:
            city_names = [single]     # Case 1: single city from NLP
    else:
        raise HTTPException(status_code=400, detail="Please specify a destination")

    # Case 3: country only — ask OpenAI to select representative cities
    if country_name and not city_names:
        city_names = await select_cities_for_country(country_name, duration_days)
        if not city_names:
            # Fallback to single representative city (hardcoded map, then OpenAI resolver)
            single = COUNTRY_TO_CITY.get(country_name.lower())
            if not single:
                single = await resolve_country_to_city(country_name)
            city_names = [single] if single else []
        if not city_names:
            raise HTTPException(status_code=400, detail=f"Could not determine cities for {country_name}")

    if not city_names:
        raise HTTPException(status_code=400, detail="Please specify a destination")

    day_counts = distribute_days(duration_days, len(city_names))
    return city_names, day_counts, country_name

"""Versioned prototype food KB. Ranges describe food classes, never the user's sample.

Ranges are broad indicative reference bands, not certified measurements. pH in dry
foods depends on slurry preparation. These sources are reading/validation leads,
not a claim that every band is a directly cited experimental result.
"""
from app.schemas.food import FoodProfile, PropertyValue

SOURCE_NOTE = 'Prototype reference band; varies by variety, recipe, maturity and processing. Requires validation.'
PH_SOURCE = 'https://ucanr.edu/sites/default/files/2020-12/341822.pdf'
COMPOSITION_SOURCE = 'https://fdc.nal.usda.gov/'
POSTHARVEST_SOURCE = 'https://postharvest.ucdavis.edu/produce-facts-sheets'

# name, aliases, category, moisture range, pH range (None = unavailable), fat range,
# respiration, oxygen sensitivity, moisture sensitivity, storage °C, form, light sensitive, notes
FOODS = [
    ('Tomato', ['tomatoes'], 'Fresh Produce', (90,95), (4.0,4.9), (0.1,0.5), 'high','medium','high',(10,15),'solid',False,
     'Maturity-dependent: mature-green fruit generally needs 12.5–15 °C; firm-ripe fruit may tolerate 7–10 °C briefly. An 8 °C / 10-day target needs chilling-injury validation.'),
    ('Potato', ['potatoes','aloo'], 'Fresh Produce', (75,82), (5.4,6.0), (0.05,0.3), 'low','low','medium',(7,12),'solid',True,
     'Store in darkness with ventilation; prevent greening, sprouting and condensation. Cold sweetening matters for frying potatoes.'),
    ('Onion', ['onions'], 'Fresh Produce', (86,92), (5.3,5.9), (0.05,0.3), 'low','low','low',(0,5),'solid',False,
     'Cured dry onions require ventilation and dry surfaces; avoid sealed humid packs. Cultivar and curing affect storage.'),
    ('Apple', ['apples'], 'Fresh Produce', (82,88), (3.0,4.0), (0.1,0.5), 'medium','medium','medium',(0,4),'solid',False,
     'Ethylene-producing fruit; cultivar-specific controlled-atmosphere limits require validation.'),
    ('Banana', ['bananas'], 'Fresh Produce', (72,78), (4.5,5.2), (0.1,0.6), 'high','medium','medium',(13,15),'solid',False,
     'Chilling-sensitive below about 13 °C. Ripening raises respiration and changes gas-exchange needs.'),
    ('Mango', ['mangoes','mangos'], 'Fresh Produce', (80,86), (3.4,4.8), (0.1,0.8), 'high','medium','high',(10,13),'solid',False,
     'Ripeness and cultivar determine chilling sensitivity; avoid unvalidated low-oxygen sealed packs.'),
    ('Orange', ['oranges'], 'Fresh Produce', (85,89), (3.0,4.2), (0.1,0.4), 'low','medium','medium',(3,8),'solid',False,
     'Maintain airflow and avoid rind damage; storage depends on cultivar and decay control.'),
    ('Carrot', ['carrots'], 'Fresh Produce', (86,91), (5.8,6.4), (0.1,0.4), 'medium','medium','high',(0,4),'solid',False,
     'High humidity limits wilting; ventilated packaging must avoid surface condensation.'),
    ('Cucumber', ['cucumbers'], 'Fresh Produce', (94,97), (5.1,5.8), (0.05,0.3), 'medium','medium','high',(10,12),'solid',False,
     'Chilling-sensitive; limit moisture loss without trapping condensation.'),
    ('Leafy vegetables', ['leafy greens','spinach','lettuce'], 'Fresh Produce', (90,96), (5.5,7.0), (0.1,0.8), 'high','medium','high',(0,5),'solid',False,
     'Broad leafy-greens class, not a species-specific measurement. Rapid cooling and respiration-matched ventilation are important.'),
    ('Milk', ['fresh milk','pasteurized milk'], 'Dairy', (86,90), (6.4,6.8), (0.1,6.0), 'low','high','medium',(0,4),'liquid',True,
     'Assumes pasteurized refrigerated milk, not UHT. Maintain cold chain; packaging alone does not control microbial safety.'),
    ('Curd', ['yogurt','yoghurt','dahi','curd/yogurt'], 'Dairy', (80,90), (4.0,4.6), (0.1,8.0), 'low','medium','high',(0,4),'semi_solid',False,
     'Assumes plain cultured refrigerated dairy. Acidity requires a compatible food-contact surface, coating or liner; it does not rule out all metal-containing structures.'),
    ('Paneer', ['cottage cheese'], 'Dairy', (50,65), (5.0,6.0), (15,25), 'low','high','high',(0,4),'solid',False,
     'Fresh high-moisture cheese needs refrigeration, hygienic filling and well-sealed barrier packaging.'),
    ('Cheese', ['cheddar'], 'Dairy', (30,60), (4.8,6.5), (15,35), 'low','high','high',(0,5),'solid',False,
     'Broad cheese class: rind, style and ripening culture change gas requirements; verify the exact cheese before commercial use.'),
    ('Biscuits', ['biscuit','cookies','cookie'], 'Bakery', (1,5), None, (10,25), 'low','medium','high',(15,25),'solid',False,
     'Assumes dry crisp biscuits. Moisture uptake softens texture; fats oxidize. pH reference unavailable without recipe and slurry method.'),
    ('Chips', ['potato chips','crisps'], 'Snacks', (1,4), None, (25,40), 'low','high','high',(15,25),'solid',True,
     'Fried snack assumption. Limit oxygen, light and moisture; protective headspace reduces breakage. No universal pH without test method.'),
    ('Bread', ['loaf','loaf of bread'], 'Bakery', (30,42), (5.0,6.2), (1,6), 'low','medium','medium',(15,25),'solid',False,
     'Bread type, preservatives and hygiene determine mould risk; refrigeration can accelerate staling.'),
    ('Pickle', ['pickles','achar'], 'Processed Food', (40,80), (2.8,4.6), (0,20), 'low','medium','high',(15,25),'semi_solid',True,
     'Acid/salt/oil contents depend strongly on recipe. Requires validated acidification or processing and an acid-compatible contact layer.'),
    ('Jam', ['fruit jam'], 'Processed Food', (25,40), (2.8,3.8), (0,0.5), 'low','medium','high',(15,25),'semi_solid',False,
     'Assumes high-sugar processed jam. Verify hot-fill compatibility, closure, water activity and recipe; opened jars often need refrigeration.'),
    ('Spices', ['spice','ground spices'], 'Powdered Food', (5,12), None, (2,15), 'low','medium','high',(15,25),'powder',True,
     'Broad spice class; protect volatile aromas and exclude humidity and light. Individual spice composition varies greatly.'),
    ('Rice', ['dry rice'], 'Grains', (10,14), None, (0.3,3.0), 'low','low','high',(15,25),'solid',False,
     'Assumes dry uncooked rice, not cooked rice. Prevent moisture uptake and insects; pH is not a stand-alone dry grain storage metric.'),
    ('Flour', ['wheat flour','atta'], 'Powdered Food', (10,14), None, (1,3), 'low','medium','high',(15,25),'powder',False,
     'Dry wheat flour assumption. Wholegrain flour can oxidize faster; protect from humidity and pests.'),
    ('Pulses', ['lentils','dal'], 'Grains', (8,13), None, (0.5,3), 'low','low','high',(15,25),'solid',False,
     'Dry pulses need moisture and insect protection; cooked pulses need a separate profile.'),
    ('Milk Powder', ['powdered milk'], 'Powdered Food', (2,5), (6.4,6.8), (1,28), 'low','high','high',(15,25),'powder',True,
     'Skim and whole powders differ in fat; pH refers to reconstituted product. Avoid moisture uptake, caking and oxidation.'),
]

def property_value(value, source='reference'):
    return PropertyValue(value=value, source=source, basis=SOURCE_NOTE if source == 'reference' else 'AI-estimated range — requires validation' if source == 'ai_estimated' else 'Reference data unavailable')

def band(value, unit='', source='reference'):
    return property_value(f'{value[0]:g}–{value[1]:g}{unit}' if value else 'Reference data unavailable', source if value else 'unavailable')

PROFILES = {}
ALIASES = {}
for name, aliases, category, moisture, ph, fat, respiration, oxygen, sensitivity, temp, form, light, notes in FOODS:
    acidity = 'Acidic range; batch verification required' if ph and ph[1] <= 4.6 else 'Acidic to mildly acidic; verify batch pH' if ph and ph[0] < 4.6 else 'Low-acid reference range' if ph else 'Reference data unavailable'
    considerations = ['Food-contact grade and migration compliance must be verified for the complete structure.']
    considerations += ['Controlled O₂/CO₂ exchange and moisture balance; no hermetic assumption.'] if category == 'Fresh Produce' else ['Seal integrity and moisture/oxygen barriers should be matched to the formulation.']
    if light: considerations.append('Light protection is relevant; use opaque packaging or secondary light shielding.')
    PROFILES[name] = FoodProfile(food=name, food_category=category, provenance='reference',
        properties={'moisture':band(moisture,'%'), 'ph':band(ph), 'fat':band(fat,'%'),
                    'respiration':property_value(respiration.title() + ' (temperature/maturity dependent)' if category == 'Fresh Produce' else 'Non-respiring product'),
                    'acidity':property_value(acidity, 'reference' if ph else 'unavailable'),
                    'oxygen_sensitivity':property_value(oxygen.title()), 'moisture_sensitivity':property_value(sensitivity.title()),
                    'co2_sensitivity':property_value('Relevant: commodity-specific tolerance must be verified' if category == 'Fresh Produce' else 'Formulation-dependent; no gas mixture prescribed')},
        moisture_range=moisture, ph_range=ph, fat_range=fat, respiration=respiration,
        oxygen_sensitivity=oxygen, moisture_sensitivity=sensitivity, product_form=form,
        light_sensitive=light, temperature_range=temp, storage_notes=notes,
        packaging_considerations=considerations, sources=[COMPOSITION_SOURCE, PH_SOURCE, POSTHARVEST_SOURCE] if category == 'Fresh Produce' else [COMPOSITION_SOURCE, PH_SOURCE], confidence='medium')
    for alias in [name, *aliases]: ALIASES[alias.casefold()] = name

def find_profile(name):
    canonical = ALIASES.get(' '.join(name.casefold().split()))
    return PROFILES[canonical].model_copy(deep=True) if canonical else None

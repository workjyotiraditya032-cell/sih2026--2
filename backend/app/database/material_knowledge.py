"""Structure-level grounding supplements existing material reference rows."""
MATERIAL_CONTEXT = {
    'LDPE': ('LDPE heat-sealed film pouch', ['solid','liquid','semi_solid','powder'], 'Transparent', False),
    'HDPE': ('HDPE film bag or liner', ['solid','liquid','powder'], 'Translucent', False),
    'PET': ('PET structure with compatible sealant layer', ['solid'], 'Transparent', False),
    'PP': ('BOPP/CPP sealable film structure', ['solid','powder'], 'Transparent', False),
    'Metallized Film': ('Metallized PET/BOPP with food-contact sealant layer', ['solid','powder'], 'Opaque', True),
    'Aluminum Foil Laminate': ('PET / aluminium foil / food-contact PE laminate', ['solid','liquid','semi_solid','powder'], 'Opaque', True),
    'Biodegradable Film': ('PLA/PBAT compostable film', ['solid'], 'Grade-dependent', False),
    'Micro-Perforated Film': ('Micro-perforated LDPE film', ['solid'], 'Transparent', False),
    'High-Barrier Laminate': ('PET / EVOH / PE barrier pouch', ['solid','liquid','semi_solid','powder'], 'Grade-dependent', False),
    'Paper-Based Ventilated Bag': ('Ventilated kraft-paper bag with light shielding', ['solid'], 'Opaque', True),
    'PP Cup with Sealed Lid': ('Food-contact PP cup with compatible sealed lid', ['semi_solid','solid'], 'Grade-dependent', False),
    'Opaque HDPE Bottle': ('Opaque HDPE bottle with sealed food-contact closure', ['liquid'], 'Opaque', True),
}

def context_for(name):
    row = MATERIAL_CONTEXT.get(name)
    if not row:
        return {}
    structure, forms, transparency, light_protection = row
    return {'packaging_structure':structure, 'product_forms':forms, 'transparency':transparency,
            'light_protection':light_protection,
            'food_contact_suitability':'Conditional: food-contact grade, complete structure, coatings/liners, migration and seal integrity require validation. No certification is claimed.'}

"""Food Intelligence Engine: grounding -> compatibility -> validated Groq reasoning."""
from fastapi import HTTPException
from app.core.config import settings
from app.database import repository
from app.database.food_knowledge import band, property_value
from app.schemas.food import FoodEstimate, FoodInput, FoodProfile, SimpleRecommendationRequest, AISelection, IntelligenceOut
from app.schemas.recommendation import RecommendationRequest
from app.services import groq_service, recommendation_service

FALLBACK_MESSAGE = 'AI service temporarily unavailable — showing knowledge-base recommendation.'
DISCLAIMER = ('Values shown are reference/estimated ranges and should be validated against laboratory data and packaging standards before commercial use. '
              'This prototype does not predict or guarantee shelf life. No chemical values are measured from images.')


def identify_food(request: FoodInput):
    image = None
    if request.image_id:
        from app.services.image_service import image_record
        image = image_record(str(request.image_id))
        if image['status'] != 'complete' or not request.image_confirmed:
            raise HTTPException(422, 'Please confirm the food name identified from the image, or correct it, before analyzing.')
    profile = repository.fetch_food_profile(request.food_name)
    if profile:
        return profile, image['identification'] if image else None
    try:
        estimate = groq_service.complete(FoodEstimate,
            'Identify this food precisely. Unknown, nonsensical, non-food or ambiguous entries require clarification. '
            'Do not interpret cooked rice as dry rice, or a mixed dish as its raw ingredient. '
            'Use broad estimated ranges for unknown references; null pairs when unavailable. All supplied profile values will be labelled AI-estimated.',
            {'food_name':request.food_name})
    except groq_service.AIUnavailable:
        raise HTTPException(422, 'Reference data unavailable for this food and AI service is temporarily unavailable. Please choose a reference commodity or retry later.')
    if not estimate.recognized or estimate.needs_clarification or estimate.confidence == 'low':
        raise HTTPException(422, estimate.clarification or 'Please provide a more specific food name and preparation (for example, dry rice or cooked rice).')
    grounded = repository.fetch_food_profile(estimate.food)
    if grounded:
        return grounded, image['identification'] if image else None
    ranges = {k: (getattr(estimate,k+'_min'),getattr(estimate,k+'_max')) if getattr(estimate,k+'_min') is not None else None
              for k in ('moisture','ph','fat','temperature')}
    p = FoodProfile(food=estimate.food, food_category=estimate.category, provenance='ai_estimated',
        properties={'moisture':band(ranges['moisture'],'%','ai_estimated'), 'ph':band(ranges['ph'],'','ai_estimated'),
                    'fat':band(ranges['fat'],'%','ai_estimated'),
                    **{k:property_value(getattr(estimate,k), 'ai_estimated') for k in ('respiration','acidity','oxygen_sensitivity','moisture_sensitivity','co2_sensitivity')}},
        moisture_range=ranges['moisture'], ph_range=ranges['ph'], fat_range=ranges['fat'],
        respiration=estimate.respiration, oxygen_sensitivity=estimate.oxygen_sensitivity,
        moisture_sensitivity=estimate.moisture_sensitivity, product_form=estimate.product_form,
        light_sensitive=estimate.light_sensitive, temperature_range=ranges['temperature'],
        storage_notes=estimate.storage_notes, packaging_considerations=estimate.packaging_considerations,
        sources=[], confidence='low')
    return p, image['identification'] if image else None


def engine_input(request, profile):
    assumptions = ['Food-property bands are typical/reference or AI-estimated values, not measurements of your food.',
                   'Reference-range midpoints are used internally for weighted scoring; they are not laboratory measurements.']
    humidity = 90 if request.transportation == 'high_humidity' else 85 if request.storage_type == 'chilled' else 65
    assumptions.append(f'Relative humidity is a scenario assumption ({humidity}% RH), inferred from the selected conditions, not measured.')
    values = {}
    for key, field, neutral in [('moisture','moisture_content',50),('fat','oil_content',5),('ph','ph',7)]:
        span = getattr(profile, key+'_range')
        values[field] = sum(span)/2 if span else neutral
        if not span:
            assumptions.append(f'{key.title()} reference data unavailable; an internal neutral scoring assumption is used, not a food-property estimate.')
    cost = {'cost':'low_cost','shelf_life':'performance_first','sustainability':'balanced','balanced':'balanced'}[request.priority]
    internal = RecommendationRequest(commodity=profile.food, food_category=profile.food_category, **values,
        respiration_rate=profile.respiration, oxygen_sensitivity=profile.oxygen_sensitivity,
        moisture_sensitivity=profile.moisture_sensitivity, shelf_life_days=request.shelf_life_days,
        temperature=request.temperature, storage_type=request.storage_type, relative_humidity=humidity,
        transportation=request.transportation, cost_priority=cost,
        sustainability_priority='high' if request.priority == 'sustainability' else 'medium', map_required=None,
        product_form=profile.product_form, light_sensitive=profile.light_sensitive,
        priority=request.priority, profile_source=profile.provenance)
    return internal, assumptions


def warnings_for(request, profile):
    warnings = [profile.storage_notes, 'Desired shelf life is a target, not a validated prediction or safety guarantee.']
    if profile.temperature_range and not profile.temperature_range[0] <= request.temperature <= profile.temperature_range[1]:
        warnings.append(f'Requested {request.temperature:g} °C is outside the typical {profile.temperature_range[0]:g}–{profile.temperature_range[1]:g} °C storage band. Packaging cannot compensate for inappropriate storage.')
    if profile.food_category == 'Dairy' and request.storage_type != 'chilled':
        warnings.append('The dairy reference profile assumes refrigeration, not aseptic/UHT processing. This scenario requires process and microbiological validation.')
    if profile.food_category == 'Fresh Produce' and request.shelf_life_days > 30:
        warnings.append('This extended fresh-produce target needs cultivar-specific storage trials and cannot be confirmed by this prototype.')
    if profile.provenance == 'ai_estimated':
        warnings.append('AI-estimated food profile — no commodity-specific reference record; requires validation.')
    return warnings


def recommend(request: SimpleRecommendationRequest):
    profile, identification = identify_food(request)
    internal, assumptions = engine_input(request, profile)
    materials, source = repository.fetch_materials()
    engine = recommendation_service.engine
    result = engine.recommend(internal, materials)
    warnings = warnings_for(request, profile)
    ai = None
    # Groq can compare only a technically filtered shortlist; it cannot reintroduce exclusions.
    shortlist = result.ranked[:5]
    try:
        ai = groq_service.complete(AISelection,
            'Compare the supplied packaging structures against the food profile and practical requirements. '
            'Choose one supplied material ID and up to two DIFFERENT supplied alternative IDs. '
            'Consider containment format (a dairy semi-solid often benefits from a sealed cup), acidity/contact layers, '
            'moisture, respiration, oxidation, light, cold chain and user priority. '
            'Cost and sustainability must NEVER override technical suitability. '
            'Explain the primary choice in 2–3 concise sentences and give 2–4 reasoning factors. '
            'Do not invent material specs, scientific validation, gas composition or absolute prohibitions on metal. '
            'A coated/lined metal-containing laminate can be compatible. Retain the supplied storage warnings. '
            'Reference profile does not justify high scientific confidence: choose medium or low. '
            'Numbers in explanations may only repeat supplied data, never fabricate measurements.',
            {'food_profile':profile.model_dump(mode='json'), 'user_requirements':request.model_dump(mode='json'),
             'warnings':warnings, 'candidates':[{'material':s.material.model_dump(mode='json'), 'compatibility_score':s.score,
                 'criterion_scores':{k:v.score for k,v in s.criteria.items()}} for s in shortlist]})
        allowed = {s.material.id for s in shortlist}
        chosen = [ai.primary_material_id, *ai.alternatives]
        if not set(chosen) <= allowed or len(set(chosen)) != len(chosen) or len(ai.alternatives) != len(ai.alternative_reasons):
            raise groq_service.AIUnavailable('invalid_material_selection')
    except groq_service.AIUnavailable:
        ai = None
    if ai:
        order = [ai.primary_material_id, *ai.alternatives]
        ranked = sorted(result.ranked, key=lambda x: order.index(x.material.id) if x.material.id in order else len(order)+result.ranked.index(x))
        result.payload = engine._build_payload(internal, result.requirements, result.weights, ranked,
                                              result.excluded, ranked[0], ranked[1:3])
        result.payload['summary'] = ai.explanation
        result.payload['reasons'] = ai.reasoning_factors
        for alt in result.payload['alternatives']:
            if alt['material'].id in ai.alternatives:
                alt['main_advantage'] = ai.alternative_reasons[ai.alternatives.index(alt['material'].id)]
        warnings.extend(ai.warnings)
        result.payload['engine_version'] = 'food-intelligence-2.0 + Groq'
    else:
        result.payload['engine_version'] = 'food-intelligence-2.0 (knowledge base)'
        gas = 'controlled gas exchange and moisture balance' if profile.food_category == 'Fresh Produce' else 'seal integrity and moisture/oxygen protection'
        result.payload['summary'] = (f'{profile.food} is a {profile.food_category.lower()} food with {profile.properties["moisture"].value} typical moisture. '
            f'The selected structure balances {gas} against the {request.shelf_life_days}-day target at {request.temperature:g} °C and your {request.priority.replace("_"," ")} priority. '
            'This is a knowledge-base recommendation; the target shelf life is not validated.')
    response = recommendation_service._build_response(internal, result, source)
    selected = response.recommended_material
    confidence = 'low' if profile.provenance == 'ai_estimated' or (ai and ai.confidence == 'low') else 'medium'
    response.intelligence = IntelligenceOut(mode='ai' if ai else 'knowledge_base',
        provider='Groq' if ai else None, model=settings.groq_model if ai else None,
        message='Groq reasoning grounded in the food and packaging knowledge bases.' if ai else FALLBACK_MESSAGE,
        food_profile=profile, user_requirements=request, packaging_structure=selected.packaging_structure or selected.material_name,
        cost_level='low' if selected.relative_cost <= 2 else 'medium' if selected.relative_cost == 3 else 'high',
        sustainability_level='medium' if selected.recyclable or selected.biodegradable else 'low',
        confidence=confidence, confidence_basis='Qualitative evidence confidence, not an accuracy score; no laboratory or shelf-life validation. Sustainability is an indicative end-of-life proxy, not an LCA.',
        warnings=list(dict.fromkeys(warnings)), assumptions=assumptions, image_identification=identification)
    response.disclaimer = DISCLAIMER
    response.input_provenance = ('The input object is an internal scoring snapshot, not user measurements. '
        'Food-property numbers are reference/AI-estimated range midpoints or explicitly disclosed neutral scoring assumptions; '
        'humidity is a scenario assumption. See intelligence.food_profile for ranges/provenance and intelligence.user_requirements for actual user inputs.')
    for factor in response.key_factors:
        if factor.factor in ('Respiration rate', 'Moisture sensitivity', 'Oxygen sensitivity', 'Oil/fat content'):
            factor.value += ' (inferred profile)'
        if factor.factor == 'Relative humidity':
            factor.value += ' (scenario assumption)'
    response.analysis_id = repository.save_recommendation_log(internal.model_dump(), response.model_dump(mode='json'),
        selected.material_name, response.suitability_score, source)
    return response

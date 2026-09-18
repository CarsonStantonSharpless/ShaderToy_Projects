//R=fluid amount
//G=momentum.x
//B=momentum.y
//A=resolution stamp

const float MAX_FLUID = 12.0;

const float FIELD_STRENGTH = 0.02;
const float VELOCITY_DAMPING = 0.985;
const float DIPOLE_ROTATION_SPEED = 0.9;

const float POLE_DISTANCE = 0.05;

const ivec2 NEIGHBORS[8] = ivec2[8](
    ivec2(-1, -1),
    ivec2( 0, -1),
    ivec2( 1, -1),
    ivec2(-1,  0),
    ivec2( 1,  0),
    ivec2(-1,  1),
    ivec2( 0,  1),
    ivec2( 1,  1)
);

float resolutionStamp()
{
    uvec2 size = uvec2(iResolution.xy);
    uint hash = size.x * 73856093u ^ size.y * 19349663u;
    return float(hash & 0x00FFFFFFu);
}

//magnetic dipole field
vec2 dipoleField(vec2 p)
{
    float angle = iTime * DIPOLE_ROTATION_SPEED;
    vec2 m = vec2(cos(angle), sin(angle));

    vec2 north =  m * POLE_DISTANCE * 0.5;
    vec2 south = -m * POLE_DISTANCE * 0.5;

    vec2 rn = p - north;
    vec2 rs = p - south;

    float dn2 = dot(rn, rn) + 0.04;
    float ds2 = dot(rs, rs) + 0.04;

    vec2 northField = rn / (dn2 * sqrt(dn2));
    vec2 southField = rs / (ds2 * sqrt(ds2));

    return northField - southField;
}

float magneticStrength(vec2 p)
{
    vec2 field = dipoleField(p);
    return dot(field, field);
}

vec2 magneticGradient(vec2 p)
{
    float e = 1.0 / iResolution.y;

    float left = magneticStrength(p - vec2(e, 0.0));
    float right = magneticStrength(p + vec2(e, 0.0));
    float down = magneticStrength(p - vec2(0.0, e));
    float up = magneticStrength(p + vec2(0.0, e));

    vec2 gradient = vec2(right - left, up - down) / (2.0 * e);

    gradient /= 1.0 + length(gradient);

    return gradient;
}

bool validCell(ivec2 cell)
{
    ivec2 size = ivec2(iResolution.xy);

    return
        cell.x >= 0 &&
        cell.y >= 0 &&
        cell.x < size.x &&
        cell.y < size.y;
}

//velocity from momentum
vec2 getVelocity(vec4 state)
{
    float fluid = state.r;

    if (fluid < 0.0001)
        return vec2(0.0);

    return state.gb / fluid;
}

float flowWeight(vec2 velocity, ivec2 direction)
{
    float speed = length(velocity);

    if (speed < 0.0001)
        return 0.0;

    vec2 velocityDir = velocity / speed;

    float weight = pow(
        max(
            dot(velocityDir, normalize(vec2(direction))),
            0.0
        ),
        4.0
    );

    return weight / 1.5;
}

float outgoingFluid(vec4 state)
{
    float fluid = state.r;
    vec2 velocity = getVelocity(state);

    float movingFraction = clamp(length(velocity), 0.0, 1.0);

    return fluid * movingFraction;
}

float incomingDemand(ivec2 cell)
{
    float demand = 0.0;

    for (int i = 0; i < 8; i++)
    {
        ivec2 source = cell + NEIGHBORS[i];

        if (!validCell(source))
            continue;

        vec4 sourceState = texelFetch(iChannel0, source, 0);
        vec2 sourceVelocity = getVelocity(sourceState);
        float outgoing = outgoingFluid(sourceState);

        ivec2 towardUs = -NEIGHBORS[i];
        float weight = flowWeight(sourceVelocity, towardUs);

        demand += outgoing * weight;
    }

    return demand;
}

//fraction of incoming mass this cell can accept
float incomingAcceptance(ivec2 cell)
{
    vec4 state = texelFetch(iChannel0, cell, 0);

    float freeSpace = max(MAX_FLUID - state.r, 0.0);

    if (freeSpace <= 0.0)
        return 0.0;

    float demand = incomingDemand(cell);

    if (demand < 0.0001)
        return 0.0;

    return min(1.0, freeSpace / demand);
}

//move mass and momentum
float moveFluid(ivec2 cell, out vec2 newMomentum)
{
    vec4 state = texelFetch(iChannel0, cell, 0);

    float fluid = state.r;
    vec2 momentum = state.gb;
    vec2 velocity = getVelocity(state);

    float outgoing = outgoingFluid(state);

    float newFluid = fluid;
    newMomentum = momentum;

    //send
    for (int i = 0; i < 8; i++)
    {
        ivec2 target = cell + NEIGHBORS[i];

        if (!validCell(target))
            continue;

        float weight = flowWeight(velocity, NEIGHBORS[i]);
        float wantedFluid = outgoing * weight;

        if (wantedFluid < 0.000001)
            continue;

        float acceptance = incomingAcceptance(target);
        float movedFluid = wantedFluid * acceptance;

        newFluid -= movedFluid;

        vec2 packetMomentum = velocity * wantedFluid;
        newMomentum -= packetMomentum;
    }

    float ourAcceptance = incomingAcceptance(cell);

    //receive
    for (int i = 0; i < 8; i++)
    {
        ivec2 source = cell + NEIGHBORS[i];

        if (!validCell(source))
            continue;

        vec4 sourceState = texelFetch(iChannel0, source, 0);
        float sourceFluid = sourceState.r;

        if (sourceFluid < 0.0001)
            continue;

        vec2 sourceVelocity = getVelocity(sourceState);
        float sourceOutgoing = outgoingFluid(sourceState);

        ivec2 towardUs = -NEIGHBORS[i];
        float weight = flowWeight(sourceVelocity, towardUs);

        float wantedFluid = sourceOutgoing * weight;

        if (wantedFluid < 0.000001)
            continue;

        float movedFluid = wantedFluid * ourAcceptance;

        newFluid += movedFluid;

        vec2 packetMomentum = sourceVelocity * wantedFluid;
        newMomentum += packetMomentum;
    }

    newFluid = clamp(newFluid, 0.0, MAX_FLUID);

    if (newFluid < 0.0001)
    {
        newFluid = 0.0;
        newMomentum = vec2(0.0);
    }

    return newFluid;
}

vec4 update(ivec2 cell)
{
    vec2 momentum;
    float fluid = moveFluid(cell, momentum);

    if (fluid > 0.0001)
    {
        vec2 p = (vec2(cell) + 0.5 - iResolution.xy * 0.5) / iResolution.y;
        vec2 magnetForce = magneticGradient(p);

        momentum += magnetForce * FIELD_STRENGTH * fluid;
        momentum *= VELOCITY_DAMPING;
    }
    else
    {
        momentum = vec2(0.0);
    }

    return vec4(
        fluid,
        momentum.x,
        momentum.y,
        resolutionStamp()
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    ivec2 cell = ivec2(fragCoord);
    ivec2 size = ivec2(iResolution.xy);

    float stamp = resolutionStamp();

    //texture size catches resize before reading an invalid old cell
    bool resized = textureSize(iChannel0, 0) != size;

    bool initialize = iFrame == 0 || resized;

    if (!initialize)
    {
        vec4 previous = texelFetch(iChannel0, cell, 0);

        //alpha changes whenever the resolution changes
        initialize = abs(previous.a - stamp) > 0.5;
    }

    if (initialize)
    {
        fragColor = vec4(
            .75,
            0.0,
            0.0,
            stamp
        );

        return;
    }

    fragColor = update(cell);
}
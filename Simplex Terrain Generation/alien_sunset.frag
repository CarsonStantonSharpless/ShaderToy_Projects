const vec3 CAM_POS = vec3 ( 0.0, 1.6, 0.0 );

// top-right
const vec3 LIGHT_POS = CAM_POS + vec3(4.0, 1.0, 4.0);

const float maxt = 28.;
const float eps = .001;


bool raycast( in vec3 ro, in vec3 rd, out float resT )
{
    float dt = 0.02; // step size
    float mint = 0.1; // distance near clipping plane

    //loss in accuracy variables
    float lh = 0.0;
    float ly = 0.0;

    for( float t = mint; t < maxt; t += dt )
    {
        vec3 p = ro + rd * t;
        float h = fbm( p.xz );

        if( p.y < h )
        {
            // interpolate intersection distance
            resT = t - dt + dt * (lh - ly) / (p.y - ly - h + lh);
            return true;
        }

        // accuracy proportional to the distance
        dt = .02 * t;

        lh = h;
        ly = p.y;
    }

    return false;
}


vec3 getMaterial( in vec3 p, in vec3 normal )
{

    vec3 lowColor  = vec3(0.22, 0.12, 0.28);
    vec3 highColor = vec3(0.32, 0.88, 0.96);

    float heightMix = smoothstep(0.0, 0.25, p.y);

    vec3 material = mix(lowColor, highColor, heightMix);



    float slope = 1.0 - clamp(normal.y, 0.0, 1.0);




    float grain = simplex_noise2D(
        p.xz * 48.0 +
        normal.xz * 8.0
    );

    grain = grain * .5 + 0.5;

    material *= mix(
        0.58,
        .9,
        grain
    );



    float facing = normal.x * 0.5 + 0.5;

    vec3 coolSide = vec3(0.10, 0.13, 0.20);
    vec3 warmSide = vec3(0.24, 0.16, 0.24);

    vec3 normalTint = mix(coolSide, warmSide, facing);

    material = mix(
        material,
        normalTint,
        slope * 0.15
    );

    return material;
}

vec3 getNormal(vec3 p)
{
    float e = 0.002;

    // sample the nearby terrain heights
    float hL = fbm(p.xz - vec2(e, 0.0));
    float hR = fbm(p.xz + vec2(e, 0.0));
    float hD = fbm(p.xz - vec2(0.0, e));
    float hU = fbm(p.xz + vec2(0.0, e));

    // turn the height slope into a surface normal
    return normalize(vec3(
        hL - hR,
        2.0 * e,
        hD - hU
    ));
}


vec3 getSky(vec2 uv)
{
    vec3 space = vec3(0.008, 0.006, 0.018);

    vec3 sunset = vec3(1.0, 0.20, 0.04);
    vec3 brightSun = vec3(1.0, 0.72, 0.30);

    vec2 sunPos = vec2(1.5, 0.55);

    float d = length(uv - sunPos);

    // localized orange glow around the sun
    float haze = 1.0 - smoothstep(0.3, 1.4, d);
    haze = pow(haze, 2.0);

    // bright inner sun glow
    float glow = 1.0 - smoothstep(0.0, 0.6, d);
    glow = pow(glow, 3.0);

    vec3 sky = mix(space, sunset, haze * 0.75);
    sky = mix(sky, brightSun, glow * 0.8);


    // fine noisy texture in deep space
    float grain = simplex_noise2D(uv * 220.0);
    grain = grain * 0.5 + 0.5;

    sky += vec3(
        grain * 0.010,
        grain * 0.006,
        grain * 0.018
    );


    // divide the sky into small star cells
    vec2 starUV = uv * 150.0;
    vec2 cell = floor(starUV);
    vec2 local = fract(starUV);

    // random star position inside each cell
    vec2 starPos = vec2(
        simplex_noise2D(cell * 0.17 + vec2(12.3, 5.7)),
        simplex_noise2D(cell * 0.17 + vec2(41.8, 19.2))
    );

    starPos = starPos * 0.5 + 0.5;


    // decide whether this cell contains a star
    float starChance =
        simplex_noise2D(cell * 0.31 + vec2(7.4, 28.1))
        * 0.5 + 0.5;

    float star =
        1.0 - smoothstep(
            0.015,
            0.055,
            length(local - starPos)
        );

    star *= smoothstep(0.4, 0.92, starChance);


    // randomize star brightness
    float brightness =
        simplex_noise2D(cell * 0.71 + vec2(91.2, 13.7))
        * 0.5 + 0.5;

    star *= mix(0.4, 2.0, brightness);


    // randomize star color
    float colorNoise =
        simplex_noise2D(cell * 0.53 + vec2(31.7, 84.2))
        * 0.5 + 0.5;

    vec3 starColor;

    if (colorNoise < 0.25)
        starColor = vec3(1.0, 0.55, 0.35);   // red/orange
    else if (colorNoise < 0.50)
        starColor = vec3(1.0, 0.90, 0.55);   // yellow
    else if (colorNoise < 0.75)
        starColor = vec3(0.55, 0.70, 1.0);   // blue
    else
        starColor = vec3(0.90, 0.95, 1.0);   // white


    // wash stars out near the sun
    float sunWash = smoothstep(0.15, 0.75, d);

    sky += starColor * star * sunWash;

    return sky;
}

vec3 colorTerrain(
    in vec3 ro,
    in vec3 rd,
    in float resT
)
{
    vec3 p = ro + rd * resT;

    vec3 normal = getNormal(p);
    vec3 material = getMaterial(p,normal);

    vec3 lightDir = normalize(LIGHT_POS - p);

    // Lambert diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);

    // warm orange light from the sun
    vec3 sunColor = vec3(1.0, 0.35, 0.15);

    // cool ambient light from the sky
    vec3 ambientColor = vec3(0.12, 0.18, 0.25);

    // combine cool shade with warm sunlight
    vec3 lighting =
        ambientColor +
        sunColor * diffuse * 1.2;

    return material * lighting;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float frameTime = floor(iTime / 0.1) * 0.1;

    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    vec3 ro = CAM_POS + vec3(0.0, 0.0, frameTime * 0.);

    vec3 rd = normalize(
        vec3(uv.xy, 1.0) -
        vec3(0.0, 0.6, 0.0)
    );

    float resT;

    if (raycast(ro, rd, resT))
        fragColor = vec4(colorTerrain(ro, rd, resT), 1.0);
    else
        // orange sun glow diffusing into the blue sky
        fragColor = vec4(getSky(uv), 1.0);
}

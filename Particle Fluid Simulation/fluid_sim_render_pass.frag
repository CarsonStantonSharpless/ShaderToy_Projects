const float MAX_FLUID = 12.0;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    ivec2 cell = ivec2(fragCoord);


    //read simulation state from Buffer A
    vec4 state = texelFetch(iChannel0, cell, 0);


    float fluid = state.r;

    vec2 momentum = state.gb;


    //derive actual velocity from momentum
    vec2 velocity =
        fluid > 0.0001
        ? momentum / fluid
        : vec2(0.0);


    float amount =
        clamp(
            fluid / MAX_FLUID,
            0.0,
            1.0
        );


    //keep small amounts visible
    float brightness =
        sqrt(amount);


    float speed =
        length(velocity);


    //velocity visualization range
    float speedMix =
        clamp(
            speed,
            0.0,
            1.0
        );


    //slow = blue
    vec3 slowColor =
        vec3(0.02, 0.12, 1.0);

    //medium = yellow
    vec3 middleColor =
        vec3(1.0, 0.85, 0.02);

    //fast = red
    vec3 fastColor =
        vec3(1.0, 0.03, 0.01);


    //blue -> yellow -> red
    vec3 velocityColor;

    if (speedMix < 0.5)
    {
        velocityColor =
            mix(
                slowColor,
                middleColor,
                speedMix * 2.0
            );
    }
    else
    {
        velocityColor =
            mix(
                middleColor,
                fastColor,
                (speedMix - 0.5) * 2.0
            );
    }


    //fluid amount controls intensity
    vec3 color = velocityColor * brightness;


    fragColor = vec4( color, 1.0 );
}
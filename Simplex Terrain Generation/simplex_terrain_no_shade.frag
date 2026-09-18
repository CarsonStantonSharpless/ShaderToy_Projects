const vec3 CAM_POS = vec3 ( 0.0, .9, 0.0 );
const float maxt  = 4.;
const float eps = .001;

bool raycast( in vec3 ro, in vec3 rd, out float resT )
{
    float dt = 0.02; // step size
    float mint = 0.1; // distance near clipping plane
    //loss in accuracy variables
    float lh = 0.0;
    float ly = 0.0;
    for( float t = mint; t<maxt; t += dt )
    {
        vec3  p = ro + rd*t;
        float h = fbm( p.xz );
        if( p.y < h )
        {
            // interpolate intersection distance
            resT = t-dt+dt*(lh-ly)/(p.y-ly-h+lh);
            return true;
        }
        // accuracy proportional to the distance
        dt = .02*t;
        lh = h;
        ly = p.y;
    }
    return false;
}


vec3 getMaterial( in vec3 p )
{
    if ( p.y > .5 ) { return vec3(.9,.9,.9); }
    
    if ( p.y > .1) { return vec3(.7,.5,.7); }
    
    if ( p.y > .05) { return vec3(.2, .6, .2); }
    
    return vec3(.2, .3, .8);
}


vec3 colorTerrain( in vec3 ro, in vec3 rd,
                   in float resT )
{
    vec3 p = ro + rd * resT;
    
    return getMaterial( p );
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = ( fragCoord * 2.0 - iResolution.xy ) / iResolution.y;
    
    vec3 ro = CAM_POS + vec3(0.,0.,iTime*.2);
    
    vec3 rd = normalize(vec3( uv.xy, 1. ) - vec3(.0,.6,0.));
    
    float resT;
    
    if( raycast( ro, rd, resT ) )
    {
        fragColor = vec4(colorTerrain(ro,rd,resT), 1.);
    }
    
    else {  fragColor = vec4(vec3(.2,.5,.8), 1.); }
}
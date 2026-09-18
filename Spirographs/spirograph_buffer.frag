

//ratio of inner to outer ratio, value inbetween 0-1
const float K = .6180339887;

//where along the inner radius the point is generated
//also between 0-1
const float L = .3819660113;

const float SPEED = 1.;

vec2 map1( float time )
{
    float F =  SPEED  * time * ( 1. - K ) / K; 
    
    float x = ( 1. - K ) * cos(SPEED * time) + L*K * cos(F);
    float y = ( 1. - K ) * sin(SPEED * time) + L*K * sin(F);
    
    return vec2( x, y );   
}

vec2 map2( float time )
{
    float F =  SPEED  * time * ( 1. - L ) / L; 
    
    float x = ( 1. - L ) * cos(SPEED * time) + L*K * cos(F);
    float y = ( 1. - L ) * sin(SPEED * time) + L*K * sin(F);
    
    return vec2( -x, y );   
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //need to fix scaling issue
    vec2 uv = ( fragCoord * 2.0 - iResolution.xy ) / iResolution.y;
    
    
    vec2 tex_coords = fragCoord.xy / iResolution.xy;
    
    tex_coords = clamp( tex_coords, 0., 1. );
    
    vec3 prev = texture(iChannel0, tex_coords).rgb; 
    
    prev *= .995;
    
    ivec2 oldSize = textureSize(iChannel0, 0);
    ivec2 newSize = ivec2(iResolution.xy);
    if ( oldSize != newSize ) prev = vec3(0.);
    
    vec3 col1 = vec3( .3, 0., 1.);
    vec3 col2 = vec3( 7., 1., 0.);
    
    if ( distance( uv, map1( iTime ) ) < .1 || distance( uv, map2( iTime ) ) < .1){
        
        int N = 500;
        for(int i=0; i<=N; i++){

          float t = iTime - float(i)/float(N) * iTimeDelta;  
          vec2 p1 = map1(t);
          vec2 p2 = map2(t);

          float d1 = distance(uv, p1);
          float d2 = distance(uv, p2);

          prev += smoothstep(0.1, 0.01, d1) / float(N+1) * col1 *.3;
          prev += smoothstep(0.1, 0.01, d2) / float(N+1) * col2 *.3;
        }
    }
    
    fragColor = vec4( prev, 1. );
}
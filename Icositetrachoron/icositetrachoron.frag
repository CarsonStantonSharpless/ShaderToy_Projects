//the coords of the 24 vertices of the shape in 4D
const vec4 coords[24] = vec4[24](

                        vec4(1.,0.,0.,0.), vec4(-1.,0.,0.,0.), vec4(0.,1.,0.,0.), vec4(0.,-1.,0.,0.),
                        vec4(0.,0.,1.,0.), vec4(0.,0.,-1.,0.), vec4(0.,0.,0.,1.), vec4(0.,0.,0.,-1.),
                        
                        vec4(-.5,.5,.5,.5), vec4(.5,-.5,.5,.5),
                        vec4(.5,.5,-.5,.5), vec4(.5,.5,.5,-.5),
                        
                        vec4(-.5,-.5,.5,.5), vec4(-.5,.5,-.5,.5),
                        vec4(-.5,.5,.5,-.5), vec4(.5,-.5,-.5,.5),
                        vec4(.5,-.5,.5,-.5), vec4(.5,.5,-.5,-.5),
                        
                        vec4(-.5,-.5,-.5,.5), vec4(.5,-.5,-.5,-.5),
                        vec4(-.5,.5,-.5,-.5), vec4(-.5,-.5,.5,-.5),
                        
                        vec4(-.5,-.5,-.5,-.5), vec4(.5,.5,.5,.5) );

//the edges that define the shape
//It would kill (maybe not computers are pretty powerful)
//to define the edges at runtime and I am probably over engineering
//but I made a python script that takes an input of any ordering of the 24 coordinates
//and returns the 96 edges pairings, its in the common tab, nice and brute forcy
const vec2 edges[96] = vec2[96]( 
                            vec2 (12, 4),vec2 (23, 4),vec2 (21, 16),vec2 (19, 0),
                            vec2 (10, 6),vec2 (13, 8),vec2 (15, 5),vec2 (18, 1),vec2 (17, 5),
                            vec2 (8, 2),vec2 (22, 19),vec2 (11, 7),vec2 (13, 1),vec2 (13, 10),
                            vec2 (18, 3),vec2 (18, 12),vec2 (22, 3),vec2 (14, 8),vec2 (17, 7),
                            vec2 (8, 4),vec2 (22, 21),vec2 (9, 3),vec2 (11, 0),vec2 (15, 0),
                            vec2 (15, 9),vec2 (18, 5),vec2 (21, 4),vec2 (22, 5),vec2 (14, 1),
                            vec2 (17, 0),vec2 (20, 17),vec2 (11, 2),vec2 (13, 5),vec2 (20, 1),
                            vec2 (22, 7),vec2 (12, 6),vec2 (23, 6),vec2 (17, 2),vec2 (17, 11),
                            vec2 (11, 4),vec2 (16, 3),vec2 (12, 8),vec2 (23, 8),vec2 (22, 18),
                            vec2 (9, 0),vec2 (15, 6),vec2 (20, 5),vec2 (12, 1),vec2 (20, 14),
                            vec2 (23, 10),vec2 (14, 7),vec2 (22, 20),vec2 (8, 6),vec2 (13, 2),
                            vec2 (19, 15),vec2 (16, 7),vec2 (20, 7),vec2 (12, 3),vec2 (10, 5),
                            vec2 (16, 0),vec2 (19, 17),vec2 (16, 9),vec2 (14, 2),vec2 (14, 11),
                            vec2 (8, 1),vec2 (20, 2),vec2 (21, 1),vec2 (14, 4),vec2 (19, 3),
                            vec2 (10, 0),vec2 (16, 4),vec2 (22, 1),vec2 (21, 3),vec2 (23, 0),
                            vec2 (20, 13),vec2 (18, 13),vec2 (21, 12),vec2 (12, 9),vec2 (23, 9),
                            vec2 (19, 5),vec2 (10, 2),vec2 (9, 4),vec2 (15, 10),vec2 (18, 6),
                            vec2 (23, 2),vec2 (18, 15),vec2 (21, 14),vec2 (23, 11),vec2 (17, 10),
                            vec2 (19, 7),vec2 (9, 6),vec2 (19, 16),vec2 (13, 6),vec2 (15, 3),
                            vec2 (16, 11),vec2 (21, 7) );

//the camera also has to live in 4D space so that any render 
//actually makes sense
const vec4 cam_pos = vec4( 0., 0., -1.4, 2. );

//to render edges, taken from Inigo Quilez: https://iquilezles.org/articles/distfunctions/
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}


//2D rotation matrix
mat2 rot2D( float a, float b )
{
    float c = cos(a);
    float s = sin(b);
    return mat2(c,-s,s,c);
}

vec4 rot4D( in vec4 p )
{
    float theta = iTime*.6;
    float phi   = iTime*.4;

    vec4 q = p;
    
    q.xw *= rot2D(theta,theta);
    
    q.yz *= rot2D(theta,phi);
    
    q.wz *= rot2D(theta,theta);
    
    return q;
}

//we will prespective project into 3D so that we can raymarch in the same manner
vec3[24] project()
{
    //we assume that we live on the hyperplane w=0
    
    vec3 pos[24];
    
    //for each vertex in the shape
    for (int i = 0; i < 24; i++)
    {
        vec4 dist = rot4D(coords[i]) - cam_pos;
        
        float t = -cam_pos.w / dist.w;
        
        pos[i] = (cam_pos + dist * t).xyz;
    }
    
    return pos;
}


float map( in vec3 p, in vec3 vertices[24] )
{
    
    //there are 96 edges that we want to render (how fun)
    float d = 1e10;
    for(int i=0; i<96; i++)
    {
        vec2 edge = edges[i];
        
        d = min(d, sdCapsule(p, vertices[int(edge.x)], vertices[int(edge.y)], .015)); 
    }
    
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = ( fragCoord * 2.0 - iResolution.xy ) / iResolution.y;
    
    
    vec3 ray_direc = normalize( vec3( uv, 1. ) ); // ray direction
    
    vec3 col = vec3(0.); //current pixel color
    
    float t = 0.; //ray magnitude
    
    vec3 vertices[24] = project(); //projected vertices
    
    for (int i = 0; i < 50; i++)
    {
        vec3 p = cam_pos.xyz + ray_direc * t; //position along the ray

        float d = map(p, vertices); //current distance to the scene

        t += d; //march the ray
        
        if (d < .001 || t > 100.) break;
    }
    
    if (t * .3 < 1.){
    col = vec3(t * .1) + vec3(.1 / t,.4/t,.7);
    }
    else col =  vec3(0.5,0.5,0.8) * (1. - length(uv)*.5);
    
    
    
    fragColor = vec4(col, 1.);
}
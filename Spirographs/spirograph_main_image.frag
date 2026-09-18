void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 tex_coords = fragCoord.xy / iResolution.xy;
    
    tex_coords = clamp( tex_coords, 0., 1. );
    
    vec4 prev = texture(iChannel0, tex_coords); 
    
    fragColor = prev;
}
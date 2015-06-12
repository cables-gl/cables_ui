var examples=
    [
        {
            "title":"triangledance",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"dc8530c7-bfa9-4317-b662-46772e38760a","uiAttribs":{"translate":{"x":273,"y":18}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"Repeat","objName":"Ops.Repeat","id":"b24ec028-772c-4e50-beda-a14e91c929c4","uiAttribs":{"translate":{"x":108,"y":129}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"b24ec028-772c-4e50-beda-a14e91c929c4","objOut":"9baac4cd-674d-4898-a5cc-d9e5aa0ea713"}]},{"name":"num","value":"11"}],"portsOut":[{"name":"trigger","value":null},{"name":"index","value":10}]},{"name":"Triangle","objName":"Ops.Gl.Meshes.Triangle","id":"fe8467c7-13d7-4e28-b1e9-9f2862d805e4","uiAttribs":{"translate":{"x":235,"y":548}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"fe8467c7-13d7-4e28-b1e9-9f2862d805e4","objOut":"22c9b15c-5009-4b38-a355-0f751e982a09"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"db87cec7-a912-4dab-8912-75f9f33a3d1f","uiAttribs":{"translate":{"x":95,"y":339}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"db87cec7-a912-4dab-8912-75f9f33a3d1f","objOut":"7462c8ff-3721-4209-b92d-b454893b228e"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":"0.4"},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"9baac4cd-674d-4898-a5cc-d9e5aa0ea713","uiAttribs":{"translate":{"x":99,"y":81}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"9baac4cd-674d-4898-a5cc-d9e5aa0ea713","objOut":"dc8530c7-bfa9-4317-b662-46772e38760a"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":-1},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"22c9b15c-5009-4b38-a355-0f751e982a09","uiAttribs":{"translate":{"x":235,"y":464}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"22c9b15c-5009-4b38-a355-0f751e982a09","objOut":"db87cec7-a912-4dab-8912-75f9f33a3d1f"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":0.01,"links":[{"portIn":"posZ","portOut":"result","objIn":"22c9b15c-5009-4b38-a355-0f751e982a09","objOut":"57b8504d-147f-46e3-b23a-5775bb15d60a"}]},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":214.46063406834557,"links":[{"portIn":"rotZ","portOut":"result","objIn":"22c9b15c-5009-4b38-a355-0f751e982a09","objOut":"eceeb4e0-2a9d-451d-bd09-5f222458f52b"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"eceeb4e0-2a9d-451d-bd09-5f222458f52b","uiAttribs":{"translate":{"x":463,"y":213}},"portsIn":[{"name":"number1","value":10,"links":[{"portIn":"number1","portOut":"index","objIn":"eceeb4e0-2a9d-451d-bd09-5f222458f52b","objOut":"b24ec028-772c-4e50-beda-a14e91c929c4"}]},{"name":"number2","value":21.446063406834558,"links":[{"portIn":"number2","portOut":"result","objIn":"eceeb4e0-2a9d-451d-bd09-5f222458f52b","objOut":"85450dc7-10e3-4873-8504-025009dc57e4"}]}],"portsOut":[{"name":"result","value":214.46063406834557}]},{"name":"SinusAnim","objName":"Ops.Anim.SinusAnim","id":"1f148627-3e14-4533-afc9-5440a4d95e22","uiAttribs":{"translate":{"x":458,"y":69}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"1f148627-3e14-4533-afc9-5440a4d95e22","objOut":"dc8530c7-bfa9-4317-b662-46772e38760a"}]}],"portsOut":[{"name":"result","value":0.9748210639470253}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"85450dc7-10e3-4873-8504-025009dc57e4","uiAttribs":{"translate":{"x":461,"y":125}},"portsIn":[{"name":"number1","value":"22"},{"name":"number2","value":0.9748210639470253,"links":[{"portIn":"number2","portOut":"result","objIn":"85450dc7-10e3-4873-8504-025009dc57e4","objOut":"1f148627-3e14-4533-afc9-5440a4d95e22"}]}],"portsOut":[{"name":"result","value":21.446063406834558}]},{"name":"BasicMaterial","objName":"Ops.Gl.Shader.BasicMaterial","id":"7462c8ff-3721-4209-b92d-b454893b228e","uiAttribs":{"translate":{"x":106,"y":259}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"7462c8ff-3721-4209-b92d-b454893b228e","objOut":"b24ec028-772c-4e50-beda-a14e91c929c4"}]},{"name":"r","value":1,"links":[{"portIn":"r","portOut":"result","objIn":"7462c8ff-3721-4209-b92d-b454893b228e","objOut":"ba70490d-37d4-454d-bdcc-9113dba386a7"}]},{"name":"g","value":0.38978386297822},{"name":"b","value":0.7915484751574695},{"name":"a","value":"0.6"},{"name":"texture","value":null}],"portsOut":[{"name":"trigger","value":null}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"ba70490d-37d4-454d-bdcc-9113dba386a7","uiAttribs":{"translate":{"x":177,"y":198}},"portsIn":[{"name":"number1","value":10,"links":[{"portIn":"number1","portOut":"index","objIn":"ba70490d-37d4-454d-bdcc-9113dba386a7","objOut":"b24ec028-772c-4e50-beda-a14e91c929c4"}]},{"name":"number2","value":"0.1"}],"portsOut":[{"name":"result","value":1}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"57b8504d-147f-46e3-b23a-5775bb15d60a","uiAttribs":{"translate":{"x":245,"y":369}},"portsIn":[{"name":"number1","value":10,"links":[{"portIn":"number1","portOut":"index","objIn":"57b8504d-147f-46e3-b23a-5775bb15d60a","objOut":"b24ec028-772c-4e50-beda-a14e91c929c4"}]},{"name":"number2","value":"0.001"}],"portsOut":[{"name":"result","value":0.01}]}]}
        },
        {
            "title":"if...then",
            "src":{"ops":[{"name":"if true then","objName":"Ops.IfTrueThen","id":"266b503d-3e68-4d49-b30d-9770e711ec88","uiAttribs":{"translate":{"x":249,"y":307}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"266b503d-3e68-4d49-b30d-9770e711ec88","objOut":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb"}]},{"name":"boolean","value":false,"links":[{"portIn":"boolean","portOut":"result","objIn":"266b503d-3e68-4d49-b30d-9770e711ec88","objOut":"e586181b-445c-410e-ae7a-351f487cc523"}]}],"portsOut":[{"name":"then","value":null},{"name":"else","value":null}]},{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"3a29f1af-b1ec-4234-a2d9-93983ba6ed54","uiAttribs":{"translate":{"x":236,"y":57}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"Greater","objName":"Ops.Math.Compare.Greater","id":"e586181b-445c-410e-ae7a-351f487cc523","uiAttribs":{"translate":{"x":369,"y":216}},"portsIn":[{"name":"number1","value":-0.986112747258538,"links":[{"portIn":"number1","portOut":"result","objIn":"e586181b-445c-410e-ae7a-351f487cc523","objOut":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2"}]},{"name":"number2","value":"0"}],"portsOut":[{"name":"result","value":false}]},{"name":"Triangle","objName":"Ops.Gl.Meshes.Triangle","id":"58d9665e-5fbd-4c39-826d-355b7969cb01","uiAttribs":{"translate":{"x":118,"y":446}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"then","objIn":"58d9665e-5fbd-4c39-826d-355b7969cb01","objOut":"266b503d-3e68-4d49-b30d-9770e711ec88"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"rectangle","objName":"Ops.Gl.Meshes.Rectangle","id":"fe1f5d12-e817-44ba-b961-b6e966c07648","uiAttribs":{"translate":{"x":263,"y":444}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"else","objIn":"fe1f5d12-e817-44ba-b961-b6e966c07648","objOut":"266b503d-3e68-4d49-b30d-9770e711ec88"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"SinusAnim","objName":"Ops.Anim.SinusAnim","id":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2","uiAttribs":{"translate":{"x":360,"y":131}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2","objOut":"3a29f1af-b1ec-4234-a2d9-93983ba6ed54"}]}],"portsOut":[{"name":"result","value":-0.986112747258538}]},{"name":"ClearColor","objName":"Ops.Gl.ClearColor","id":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb","uiAttribs":{"translate":{"x":167,"y":186}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb","objOut":"3a29f1af-b1ec-4234-a2d9-93983ba6ed54"}]},{"name":"r","value":null},{"name":"g","value":null},{"name":"b","value":-0.986112747258538,"links":[{"portIn":"b","portOut":"result","objIn":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb","objOut":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2"}]}],"portsOut":[{"name":"trigger","value":null}]}]}
        },
        {
            "title":"plotter",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"140e6c67-c2fe-4cfc-bd60-29f9059a77ae","uiAttribs":{"translate":{"x":128,"y":72}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"7a616490-a053-4b67-a436-83b477d75a0d","uiAttribs":{"translate":{"x":128,"y":298}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"7a616490-a053-4b67-a436-83b477d75a0d","objOut":"140e6c67-c2fe-4cfc-bd60-29f9059a77ae"}]},{"name":"posX","value":"-1.0"},{"name":"posY","value":0},{"name":"posZ","value":0},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":"33"},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"Sinus","objName":"Ops.Math.Sin","id":"c1facdcb-cc17-453f-a34a-f9fd09700a4d","uiAttribs":{"translate":{"x":351,"y":354}},"portsIn":[{"name":"number","value":543.4359998703003,"links":[{"portIn":"number","portOut":"result","objIn":"c1facdcb-cc17-453f-a34a-f9fd09700a4d","objOut":"74e9fdb1-5aa3-4386-905f-b3a247140b33"}]}],"portsOut":[{"name":"result","value":0.05949404776965134}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"cc7b9ebd-f1aa-4009-a7c9-a03c1141d7a6","uiAttribs":{"translate":{"x":350,"y":228}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"cc7b9ebd-f1aa-4009-a7c9-a03c1141d7a6","objOut":"140e6c67-c2fe-4cfc-bd60-29f9059a77ae"}]}],"portsOut":[{"name":"result","value":135.85899996757507}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"74e9fdb1-5aa3-4386-905f-b3a247140b33","uiAttribs":{"translate":{"x":350,"y":289}},"portsIn":[{"name":"number1","value":135.85899996757507,"links":[{"portIn":"number1","portOut":"result","objIn":"74e9fdb1-5aa3-4386-905f-b3a247140b33","objOut":"cc7b9ebd-f1aa-4009-a7c9-a03c1141d7a6"}]},{"name":"number2","value":"4"}],"portsOut":[{"name":"result","value":543.4359998703003}]},{"name":"Plotter","objName":"Ops.Gl.Meshes.Plotter","id":"4f31f2e8-1117-412f-9e5d-a0fea3ad24ee","uiAttribs":{"translate":{"x":128,"y":537}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"4f31f2e8-1117-412f-9e5d-a0fea3ad24ee","objOut":"7a616490-a053-4b67-a436-83b477d75a0d"}]},{"name":"value","value":0.05949404776965134,"links":[{"portIn":"value","portOut":"result","objIn":"4f31f2e8-1117-412f-9e5d-a0fea3ad24ee","objOut":"c1facdcb-cc17-453f-a34a-f9fd09700a4d"}]}],"portsOut":[{"name":"trigger","value":null}]}]}
        },
        {
            "title":"plotter noise",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f","uiAttribs":{"translate":{"x":128,"y":72}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"a29d9ec1-9eea-4154-83e9-650ccfac45c4","uiAttribs":{"translate":{"x":128,"y":298}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"a29d9ec1-9eea-4154-83e9-650ccfac45c4","objOut":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f"}]},{"name":"posX","value":"-1.0"},{"name":"posY","value":0},{"name":"posZ","value":0},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":"33"},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"Sinus","objName":"Ops.Math.Sin","id":"139a17c8-6f6a-4154-bf64-e81671b7d507","uiAttribs":{"translate":{"x":351,"y":354}},"portsIn":[{"name":"number","value":1250.5350005626678,"links":[{"portIn":"number","portOut":"result","objIn":"139a17c8-6f6a-4154-bf64-e81671b7d507","objOut":"b1e8ade3-7b4b-4354-aa25-0f3412e6021e"}]}],"portsOut":[{"name":"result","value":0.1801357272446712}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"4eef7e36-db76-4ebb-af07-fa242c4c5457","uiAttribs":{"translate":{"x":350,"y":228}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"4eef7e36-db76-4ebb-af07-fa242c4c5457","objOut":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f"}]}],"portsOut":[{"name":"result","value":250.10700011253357}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"b1e8ade3-7b4b-4354-aa25-0f3412e6021e","uiAttribs":{"translate":{"x":350,"y":289}},"portsIn":[{"name":"number1","value":250.10700011253357,"links":[{"portIn":"number1","portOut":"result","objIn":"b1e8ade3-7b4b-4354-aa25-0f3412e6021e","objOut":"4eef7e36-db76-4ebb-af07-fa242c4c5457"}]},{"name":"number2","value":"5"}],"portsOut":[{"name":"result","value":1250.5350005626678}]},{"name":"Plotter","objName":"Ops.Gl.Meshes.Plotter","id":"1b444f62-0aa0-427b-8af4-5f7fcaacc175","uiAttribs":{"translate":{"x":128,"y":537}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"1b444f62-0aa0-427b-8af4-5f7fcaacc175","objOut":"a29d9ec1-9eea-4154-83e9-650ccfac45c4"}]},{"name":"value","value":0.2936247485124131,"links":[{"portIn":"value","portOut":"result","objIn":"1b444f62-0aa0-427b-8af4-5f7fcaacc175","objOut":"dd45504a-bb59-4d4c-b6d7-d27d9a271398"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"random","objName":"Ops.Math.Random","id":"791ee797-0f23-4cf1-b06e-1b37e369a81d","uiAttribs":{"translate":{"x":539,"y":262}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"791ee797-0f23-4cf1-b06e-1b37e369a81d","objOut":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f"}]}],"portsOut":[{"name":"result","value":0.5674451063387096}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"9d6f5fea-1b77-4ac3-96a7-85bfaa532a9b","uiAttribs":{"translate":{"x":530,"y":343}},"portsIn":[{"name":"number1","value":"0.2"},{"name":"number2","value":0.5674451063387096,"links":[{"portIn":"number2","portOut":"result","objIn":"9d6f5fea-1b77-4ac3-96a7-85bfaa532a9b","objOut":"791ee797-0f23-4cf1-b06e-1b37e369a81d"}]}],"portsOut":[{"name":"result","value":0.11348902126774192}]},{"name":"sum","objName":"Ops.Math.Sum","id":"dd45504a-bb59-4d4c-b6d7-d27d9a271398","uiAttribs":{"translate":{"x":340,"y":471}},"portsIn":[{"name":"number1","value":0.1801357272446712,"links":[{"portIn":"number1","portOut":"result","objIn":"dd45504a-bb59-4d4c-b6d7-d27d9a271398","objOut":"139a17c8-6f6a-4154-bf64-e81671b7d507"}]},{"name":"number2","value":0.11348902126774192,"links":[{"portIn":"number2","portOut":"result","objIn":"dd45504a-bb59-4d4c-b6d7-d27d9a271398","objOut":"9d6f5fea-1b77-4ac3-96a7-85bfaa532a9b"}]}],"portsOut":[{"name":"result","value":0.2936247485124131}]}]}
        },
        {
            "title":"obj mesh",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"abd9d026-8735-4791-a589-99a79792783c","uiAttribs":{"translate":{"x":159,"y":29}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"OBJ Mesh","objName":"Ops.Gl.Meshes.ObjMesh","id":"1f98711a-4dc3-4e33-9968-b4fb9cc1ee6a","uiAttribs":{"translate":{"x":172,"y":382}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"1f98711a-4dc3-4e33-9968-b4fb9cc1ee6a","objOut":"b8e66c7b-7eb4-49cb-be13-8406f8853b16"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"b8e66c7b-7eb4-49cb-be13-8406f8853b16","uiAttribs":{"translate":{"x":150,"y":271}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"b8e66c7b-7eb4-49cb-be13-8406f8853b16","objOut":"1a4ba91e-fd04-44b1-a253-544adfb583a0"}]},{"name":"posX","value":0},{"name":"posY","value":"-20"},{"name":"posZ","value":"-223"},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":958.4000110626221,"links":[{"portIn":"rotY","portOut":"result","objIn":"b8e66c7b-7eb4-49cb-be13-8406f8853b16","objOut":"65a083b1-9eb6-41d4-bdcc-3cd0642a7a3b"}]},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"3b3644ad-93c9-41db-9945-32b622e62a43","uiAttribs":{"translate":{"x":379,"y":96}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"3b3644ad-93c9-41db-9945-32b622e62a43","objOut":"abd9d026-8735-4791-a589-99a79792783c"}]}],"portsOut":[{"name":"result","value":19.16800022125244}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"65a083b1-9eb6-41d4-bdcc-3cd0642a7a3b","uiAttribs":{"translate":{"x":318,"y":211}},"portsIn":[{"name":"number1","value":19.16800022125244,"links":[{"portIn":"number1","portOut":"result","objIn":"65a083b1-9eb6-41d4-bdcc-3cd0642a7a3b","objOut":"3b3644ad-93c9-41db-9945-32b622e62a43"}]},{"name":"number2","value":"50"}],"portsOut":[{"name":"result","value":958.4000110626221}]},{"name":"BasicMaterial","objName":"Ops.Gl.Shader.BasicMaterial","id":"1a4ba91e-fd04-44b1-a253-544adfb583a0","uiAttribs":{"translate":{"x":110,"y":187}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"1a4ba91e-fd04-44b1-a253-544adfb583a0","objOut":"abd9d026-8735-4791-a589-99a79792783c"}]},{"name":"r","value":0.470756561961025},{"name":"g","value":0.8225311778951436},{"name":"b","value":"1"},{"name":"a","value":1},{"name":"texture","value":{},"links":[{"portIn":"texture","portOut":"texture","objIn":"1a4ba91e-fd04-44b1-a253-544adfb583a0","objOut":"699bc89d-d1e3-4a5e-bd16-63673c1d58f0"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"texture","objName":"Ops.Gl.Texture","id":"699bc89d-d1e3-4a5e-bd16-63673c1d58f0","uiAttribs":{"translate":{"x":211,"y":83}},"portsIn":[{"name":"file","value":"assets/skull.png"}],"portsOut":[{"name":"texture","value":{}}]}]}
        },
        {
            "title":"stupid cubes",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"b55a747a-a227-41be-a6c4-da221051cd1e","uiAttribs":{"translate":{"x":317,"y":47}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"84bc0678-2c99-4585-a412-e0faf59dc80b","uiAttribs":{"translate":{"x":408,"y":248}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"84bc0678-2c99-4585-a412-e0faf59dc80b","objOut":"50dff18f-831e-4e88-a287-212195903195"}]},{"name":"posX","value":"0.20000000000000004"},{"name":"posY","value":0},{"name":"posZ","value":0},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":2708.508001804352,"links":[{"portIn":"rotY","portOut":"result","objIn":"84bc0678-2c99-4585-a412-e0faf59dc80b","objOut":"7e824d25-ef5a-4c8f-94b6-9ebf3500ff30"}]},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"BasicMaterial","objName":"Ops.Gl.Shader.BasicMaterial","id":"a560e405-fc3a-47e6-954a-2e6aa2f1cd17","uiAttribs":{"translate":{"x":421,"y":311}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"a560e405-fc3a-47e6-954a-2e6aa2f1cd17","objOut":"84bc0678-2c99-4585-a412-e0faf59dc80b"}]},{"name":"r","value":"1.6000000000000005"},{"name":"g","value":"0.30000000000000016"},{"name":"b","value":"0.30000000000000016"},{"name":"a","value":1},{"name":"texture","value":null}],"portsOut":[{"name":"trigger","value":null}]},{"name":"Cube","objName":"Ops.Gl.Meshes.Cube","id":"ecda7a66-b473-4e45-8506-6f74e7604be1","uiAttribs":{"translate":{"x":454,"y":632}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"ecda7a66-b473-4e45-8506-6f74e7604be1","objOut":"9549291e-f660-48b8-9ffa-997eebec2000"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"8881d03b-635f-4e3b-8f8d-d1434e6dc0da","uiAttribs":{"translate":{"x":424,"y":472}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"8881d03b-635f-4e3b-8f8d-d1434e6dc0da","objOut":"2ea32b54-6a85-4a66-9cac-dccd1ef8af05"}]},{"name":"posX","value":0.9769739636664628,"links":[{"portIn":"posX","portOut":"result","objIn":"8881d03b-635f-4e3b-8f8d-d1434e6dc0da","objOut":"c7646e57-4485-4c2f-bbf6-dabb6123d6aa"}]},{"name":"posY","value":0},{"name":"posZ","value":"0.4"},{"name":"scaleX","value":"0.10000000000000014"},{"name":"scaleY","value":"0.10000000000000014"},{"name":"scaleZ","value":"0.10000000000000014"},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":2708.508001804352,"links":[{"portIn":"rotZ","portOut":"result","objIn":"8881d03b-635f-4e3b-8f8d-d1434e6dc0da","objOut":"7e824d25-ef5a-4c8f-94b6-9ebf3500ff30"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"random cluster","objName":"Ops.RandomCluster","id":"2ea32b54-6a85-4a66-9cac-dccd1ef8af05","uiAttribs":{"translate":{"x":431,"y":371}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"2ea32b54-6a85-4a66-9cac-dccd1ef8af05","objOut":"a560e405-fc3a-47e6-954a-2e6aa2f1cd17"}]},{"name":"num","value":"111"},{"name":"size","value":"2"}],"portsOut":[{"name":"trigger","value":null},{"name":"index","value":110},{"name":"rnd","value":0.9261729470454156}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"7c421ed4-1a58-41b4-8828-863bd476440e","uiAttribs":{"translate":{"x":471,"y":97}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"7c421ed4-1a58-41b4-8828-863bd476440e","objOut":"b55a747a-a227-41be-a6c4-da221051cd1e"}]}],"portsOut":[{"name":"result","value":123.11400008201599}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"7e824d25-ef5a-4c8f-94b6-9ebf3500ff30","uiAttribs":{"translate":{"x":549,"y":185}},"portsIn":[{"name":"number1","value":123.11400008201599,"links":[{"portIn":"number1","portOut":"result","objIn":"7e824d25-ef5a-4c8f-94b6-9ebf3500ff30","objOut":"7c421ed4-1a58-41b4-8828-863bd476440e"}]},{"name":"number2","value":"22"}],"portsOut":[{"name":"result","value":2708.508001804352}]},{"name":"BasicMaterial","objName":"Ops.Gl.Shader.BasicMaterial","id":"9549291e-f660-48b8-9ffa-997eebec2000","uiAttribs":{"translate":{"x":447,"y":550}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"9549291e-f660-48b8-9ffa-997eebec2000","objOut":"8881d03b-635f-4e3b-8f8d-d1434e6dc0da"}]},{"name":"r","value":"0.5"},{"name":"g","value":0.9261729470454156,"links":[{"portIn":"g","portOut":"rnd","objIn":"9549291e-f660-48b8-9ffa-997eebec2000","objOut":"2ea32b54-6a85-4a66-9cac-dccd1ef8af05"}]},{"name":"b","value":"1"},{"name":"a","value":"0.9"},{"name":"texture","value":null}],"portsOut":[{"name":"trigger","value":null}]},{"name":"ClearColor","objName":"Ops.Gl.ClearColor","id":"50dff18f-831e-4e88-a287-212195903195","uiAttribs":{"translate":{"x":310,"y":162}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"50dff18f-831e-4e88-a287-212195903195","objOut":"b55a747a-a227-41be-a6c4-da221051cd1e"}]},{"name":"r","value":"0.2"},{"name":"g","value":"0.23"},{"name":"b","value":"0.4"}],"portsOut":[{"name":"trigger","value":null}]},{"name":"SinusAnim","objName":"Ops.Anim.SinusAnim","id":"c7646e57-4485-4c2f-bbf6-dabb6123d6aa","uiAttribs":{"translate":{"x":-37,"y":164}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"c7646e57-4485-4c2f-bbf6-dabb6123d6aa","objOut":"50dff18f-831e-4e88-a287-212195903195"}]}],"portsOut":[{"name":"result","value":0.9769739636664628}]}]}
        }

    ]
;
var CABLES=CABLES || {};

document.addEventListener("DOMContentLoaded", function(event)
{

    // window.onerror = function(message, url, lineNumber)
    // {
    //     console.error(message);
    //     alert('error: '+JSON.stringify(message)+'\n'+url+'\nline:'+lineNumber);
    //     return true;
    // };


    var scene=new Scene();
    ui=new CABLES.Ui();
    ui.show(scene);
});

// --------------------------------



var uiConfig=
{
    portSize:10,
    portPadding:2,

    colorLink:'#fff',
    colorLinkHover:'#00f',
    colorLinkInvalid:'#f00',
    colorOpBg:'#fff',
    colorPort:'#6c9fde',
    colorPortHover:'#f00',

    watchValuesInterval:100,
    rendererSizes:[{w:640,h:360},{w:800,h:480},{w:0,h:0}]
};

function getPortColor(type)
{
    if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
    else if(type==OP_PORT_TYPE_FUNCTION) return '#6c9fde';
    else if(type==OP_PORT_TYPE_TEXTURE)  return '#26a92a';
    else return '#c6c6c6';
}

var r;
var selectedEndPort=null;


function setStatusText(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
}


function Line(startX, startY, thisPaper)
{
    var start={ x:startX,y:startY};

    this.updateEnd=function(x, y)
    {
        end.x = x;
        end.y = y;
        this.redraw();
    };

    var end = { x: startX, y: startY };
    this.getPath = function()
    {
        var startX=start.x;
        var startY=start.y;

        var endX=end.x;
        var endY=end.y;

        
        return "M "+startX+" "+startY+" L" + endX + " " + endY;

    };
    this.thisLine = thisPaper.path(this.getPath());
    this.thisLine.attr({        stroke: uiConfig.colorLink,
        "stroke-width": 1});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}





function UiLink(port1, port2)
{
    var self=this;
    this.p1=port1;
    this.p2=port2;
    // todo check if port1 is out / port2 is in...


    this.getPath = function()
    {

        if(!port2.attrs)return '';
        if(!port1.attrs)return '';

        var fromX=port1.matrix.e+port1.attrs.x+uiConfig.portSize/2;
        var fromY=port1.matrix.f+port1.attrs.y;
        var toX=port2.matrix.e+port2.attrs.x+uiConfig.portSize/2;
        var toY=port2.matrix.f+port2.attrs.y;

        var cp1X=0;
        var cp1Y=0;

        var cp2X=0;
        var cp2Y=0;

        cp1Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;
        

        cp2Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;


        if(toY > fromY)
        {
            fromY+=uiConfig.portSize;
        }
        if(fromY > toY)
        {
            toY+=uiConfig.portSize;
        }

        cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;
        cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;


        var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

        cp1X=fromX-0;
        cp2X=toX+0;









        // return "M "+fromX+" "+fromY+" L" + cpX + " " + cpY;

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
        // return "M "+fromX+" "+fromY+" L" + toX + " " + toY;
    };

    this.thisLine = r.path(this.getPath());
    this.thisLine.attr(
    {
        "stroke": getPortColor(port1.thePort.type),
        "stroke-width": 3
    });

    this.thisLine.hover(function ()
    {
        this.attr({stroke:uiConfig.colorLinkHover});
    }, function ()
    {
        this.attr({stroke:getPortColor(self.p1.thePort.type)});
    });

    this.remove=function()
    {
        this.thisLine.remove();
    };

    this.redraw = function()
    {
        this.thisLine.attr("path", this.getPath());
    };
}

function getPortDescription(thePort)
{
    return thePort.getName()+' ('+thePort.val+')'+' ['+thePort.getTypeString()+']';
}

var links=[];
var line;

    Raphael.el.setGroup = function (group) { this.group = group; };
    Raphael.el.getGroup = function () { return this.group; };

    Raphael.fn.OpRect = function (x, y, w, h, text)
    {
        var background = this.rect(x, y, w, h).attr({
            fill: uiConfig.colorOpBg,
            stroke: "#000",
            "stroke-width": 0
        });

        var label = this.text(x+w/2,y+h/2, text);
        var layer = this.rect(x, y, w, h).attr({
            fill: "#ccc",
            "fill-opacity": 0,
            "stroke-opacity": 0,
            cursor: "move"
        });

        var group = this.set();
        group.push(background, label, layer);


        layer.setGroup(group);
        return layer;
    };


    var OpUi=function(x,y,w,h,txt)
    {
        var that=this;
        this.links=[];
        this.portsIn=[];
        this.portsOut=[];

        this.remove=function()
        {

            this.oprect.getGroup().remove();
            this.oprect.remove();
        };

        var dragger = function()
        {
          this.group = this.getGroup();

          this.previousDx = 0;
          this.previousDy = 0;

        },
        move = function (dx, dy)
        {
            var txGroup = dx-this.previousDx;
            var tyGroup = dy-this.previousDy;

            this.group.translate(txGroup,tyGroup);
            this.previousDx = dx;
            this.previousDy = dy;

            if(!that.op.uiAttribs)that.op.uiAttribs={};
            that.op.uiAttribs.translate={x:that.oprect.matrix.e,y:that.oprect.matrix.f};

                   
                        
            for(var j in that.links)
            {
                that.links[j].redraw();
            }

        },
        up = function ()
        {

        };


        this.oprect=r.OpRect(x,y,w,h, txt).drag(move, dragger, up);

        this.oprect.node.onclick = function ()
        {
            ui.showOpParams(that.op);
        };

        var PortDrag = function (event)
        {

            if(!line)
            {
                this.startx=this.matrix.e+this.attrs.x;
                this.starty=this.matrix.f+this.attrs.y;
            }
        },
        PortMove = function(dx, dy)
        {
            if(!line) line = new Line(this.startx+uiConfig.portSize/2,this.starty+uiConfig.portSize/2, r);
                else line.updateEnd(this.startx+dx,this.starty+dy);

            if(selectedEndPort===null) setStatusText('select a port to link...');
            else
            {
                var txt=Link.canLinkText(selectedEndPort.thePort,this.thePort);
                if(txt=='can link') setStatusText(  getPortDescription(selectedEndPort.thePort));
                    else setStatusText( txt );
            }

            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                line.thisLine.attr({ stroke: uiConfig.colorLink });
            }
            else
            {
                line.thisLine.attr({ stroke: uiConfig.colorLinkInvalid });
            }

        },
        PortUp = function (event)
        {
                   
            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                var link=ui.scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , this.op, this.thePort.getName());
                var thelink=new UiLink(selectedEndPort,this);
                selectedEndPort.opUi.links.push(thelink);
                that.links.push(thelink);
            }
            else
            {
                console.log('event',event);
                ui.showOpSelect(event.offsetX,event.offsetY,this.op,this.thePort);
            }

            if(line && line.thisLine)line.thisLine.remove();
            line=null;
        };

        this.addPort=function(_inout)
        {
            var yp=0;
            var inout=_inout;
            if(inout=='out') yp=20;

            var portIndex=this.portsIn.length;
            if(inout=='out') portIndex=this.portsOut.length;

            var xpos=x+(uiConfig.portSize+uiConfig.portPadding)*portIndex;
            var ypos=y+yp;

            var port = r.rect(xpos,ypos, uiConfig.portSize, uiConfig.portSize).attr({
            // var port = r.circle(x+(uiConfig.portSize+uiConfig.portPadding)*portIndex,y+yp, uiConfig.portSize/2).attr({
                fill: uiConfig.colorPort,
                "stroke-width": 0
            });


            this.oprect.getGroup().push(port);

            port.direction=inout;
            port.op=that.op;
            port.opUi=that;

            port.portIndex=portIndex;
            var thePort;
            if(inout=='out') thePort=that.op.portsOut[portIndex];
            else thePort=that.op.portsIn[portIndex];

            port.thePort=thePort;
            port.attr({fill:getPortColor(thePort.type)});
            

            port.hover(function ()
            {
                selectedEndPort=this;
                port.toFront();
                port.attr(
                {
                    // fill:uiConfig.colorPortHover,
                    x:xpos-uiConfig.portSize*0.25,
                    y:ypos-uiConfig.portSize*0.25,
                    width:uiConfig.portSize*1.5,
                    height:uiConfig.portSize*1.5,
                    stroke:'#fff',
                    'stroke-width':1,

                });
                
                var statusText='Port: ';

                
                setStatusText(getPortDescription(thePort));

            }, function ()
            {
                selectedEndPort=null;
                port.attr(
                    {
                        fill:getPortColor(this.thePort.type),
                        width:uiConfig.portSize,
                        height:uiConfig.portSize,
                        x:xpos,
                        y:ypos,
                        'stroke-width':0,
                    });

                setStatusText('');
            });

            port.drag(PortMove,PortDrag,PortUp);

            if(inout=='out') this.portsOut.push(port);
                else this.portsIn.push(port);
        };

    };
























    CABLES.Ui=function()
    {
        var self=this;
        this.ops=[];
        this.scene=null;
        var rendererSize=1;
        var watchPorts=[];

        



        var mouseNewOPX=0;
        var mouseNewOPY=0;
        var linkNewOpTo=null;
        var linkNewOpToPort=null;

        $(document).keydown(function(e)
        {

            switch(e.which)
            {
                case 27:
                    if(rendererSize==uiConfig.rendererSizes.length-1)self.cycleRendererSize();
                    ui.closeModal();
                break;
            }
        });

        this.setLayout=function()
        {
            var statusBarHeight=20;
            var menubarHeight=30;
            var optionsWidth=360;
            var rendererWidth=uiConfig.rendererSizes[rendererSize].w;
            var rendererHeight=uiConfig.rendererSizes[rendererSize].h;

            $('svg').css('height',window.innerHeight-statusBarHeight-menubarHeight);
            $('svg').css('width',window.innerWidth-rendererWidth-2);
            $('svg').css('top',menubarHeight);
            
            $('#options').css('left',window.innerWidth-rendererWidth);
            $('#options').css('top',rendererHeight);
            $('#options').css('width',optionsWidth);
            $('#options').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#meta').css('right',0);
            $('#meta').css('top',rendererHeight);
            $('#meta').css('width',rendererWidth-optionsWidth);
            $('#meta').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#menubar').css('top',0);
            $('#menubar').css('width',window.innerWidth-rendererWidth);
            $('#menubar').css('height',menubarHeight);

            if(uiConfig.rendererSizes[rendererSize].w===0)
            {
                $('#glcanvas').attr('width',window.innerWidth);
                $('#glcanvas').attr('height',window.innerHeight);
                $('#glcanvas').css('z-index',9999);
            }
            else
            {
                $('#glcanvas').attr('width',uiConfig.rendererSizes[rendererSize].w);
                $('#glcanvas').attr('height',uiConfig.rendererSizes[rendererSize].h);
            }

        };


        this.getOpList=function()
        {
            var ops=[];

            function getop(val,parentname)
            {
                if (Object.prototype.toString.call(val) === '[object Object]')
                {
                    for (var propertyName in val)
                    {
                        if (val.hasOwnProperty(propertyName))
                        {
                            var html='';
                            var opname='Ops.'+ parentname + propertyName + '';

                            var isOp=false;
                            if(eval('typeof('+opname+')')=="function") isFunction=true;

                            var op=
                            {
                                isOp:isOp,
                                name:opname,
                                lowercasename:opname.toLowerCase()
                            };
                            ops.push(op);

                            found=getop(val[propertyName],parentname+propertyName+'.');
                        }
                    }
                }
            }

            getop(Ops,'');

            return ops;
        };


        this.setUpRouting=function()
        {
            var router = new Simrou();

            router.addRoute('/').get(function(event, params)
            {

                if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20)
                {
                    scene.clear();
                    ui.showExample(0);
                }

                self.scene.deSerialize(localStorage.holo);
            });

            router.addRoute('/example/:index').get(function(event, params)
            {
                ui.showExample(params.index);
            });

            router.start('/');
        };

        this.showOpSelect=function(x,y,linkOp,linkPort)
        {
            // console.log('starting Port:',linkStartPort);
            linkNewOpToPort=linkPort;
            linkNewOpToOp=linkOp;
            mouseNewOPX=x;
            mouseNewOPY=y;
            var html = getHandleBarHtml('op_select',{ops: self.getOpList() });
            self.showModal(html);

            $('#opsearch').focus();
            $('#opsearch').on('input',function(e)
            {
                var searchFor= $('#opsearch').val();

                if(!searchFor)
                    $('#search_style').html('.searchable:{display:block;}');
                else
                    $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
            });

        };

        this.show=function(_scene)
        {
            this.scene=_scene;

            $('#meta').append(getHandleBarHtml('timeline_controler'),{});
            $('#meta').append();

            var html='<div><h2>Examples</h2>';
            for(var example in examples)
            {
                
                html+='<a href="#/example/'+example+'">'+examples[example].title+'</a><br/>';

                
            }
            html+='</div>';
            $('#meta').append(html);

            // ----

            r= Raphael(0, 0, 640, 480);
            $('svg').bind( "dblclick", function(event)
            {
                self.showOpSelect(event.offsetX,event.offsetY);
                // self.showOptionsScene();
            });

            var zpd = new RaphaelZPD(r, { zoom: true, pan: true, drag: true });
            this.bindScene(self.scene);

            window.addEventListener( 'resize', this.setLayout, false );

            this.setLayout();
            this.setUpRouting();
        };



        this.showExample=function(which)
        {
            self.scene.clear();
            self.scene.deSerialize(examples[which].src);
        };

        this.bindScene=function(scene)
        {
            scene.onUnLink=function(p1,p2)
            {
                for(var i in self.ops)
                {

                    for(var j in self.ops[i].links)
                    {
                                
                        if(
                            (self.ops[i].links[j].p1.thePort==p1 && self.ops[i].links[j].p2.thePort==p2) ||
                            (self.ops[i].links[j].p1.thePort==p2 && self.ops[i].links[j].p2.thePort==p1))
                            {
                                self.ops[i].links[j].remove();
                            }
                    }
                }
            };

            scene.onLink=function(p1,p2)
            {
                var uiPort1=null;
                var uiPort2=null;
                for(var i in self.ops)
                {
                    for(var j in self.ops[i].portsIn)
                    {
                        if(self.ops[i].portsIn[j].thePort==p1) uiPort1=self.ops[i].portsIn[j];
                        if(self.ops[i].portsIn[j].thePort==p2) uiPort2=self.ops[i].portsIn[j];
                        
                    }
                    for(var jo in self.ops[i].portsOut)
                    {
                        if(self.ops[i].portsOut[jo].thePort==p1) uiPort1=self.ops[i].portsOut[jo];
                        if(self.ops[i].portsOut[jo].thePort==p2) uiPort2=self.ops[i].portsOut[jo];
                    }
                }
        
                var thelink=new UiLink(uiPort1,uiPort2);
                uiPort1.opUi.links.push(thelink);
                uiPort2.opUi.links.push(thelink);
            };

            scene.onDelete=function(op)
            {
                for(var i in self.ops)
                {
                    if(self.ops[i].op==op)
                    {
                        self.ops[i].remove();
                        self.ops.splice( i, 1 );
                    }
                }
            };

            scene.onAdd=function(op)
            {
                var uiOp=new OpUi(mouseNewOPX, mouseNewOPY, 100, 30, op.name);
                uiOp.op=op;
                self.ops.push(uiOp);
                
                for(var i in op.portsIn)
                {
                    uiOp.addPort('in');
                }
                for(var i2 in op.portsOut)
                {
                    uiOp.addPort('out');
                }

                if(op.uiAttribs)
                {
                    if(op.uiAttribs.hasOwnProperty('translate'))
                    {
                        uiOp.oprect.getGroup().translate(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
                    }
                }

                if(linkNewOpToPort)
                {
                    var foundPort=op.findFittingPort(linkNewOpToPort);

                    if(foundPort)
                    {
                        var link=ui.scene.link(
                            linkNewOpToOp,
                            linkNewOpToPort.getName(),
                            op,
                            foundPort.getName());
                    }
                }

                linkNewOpToOp=null;
                linkNewOpToPort=null;

                mouseNewOPX=0;
                mouseNewOPY=0;
                
                ui.showOpParams(op);
          };
      };

        this.cycleRendererSize=function()
        {
            rendererSize++;
            if(rendererSize>uiConfig.rendererSizes.length-1)rendererSize=0;

            self.setLayout();
        };

        this.closeModal=function()
        {
            $('#modalcontent').html('');
            $('#modalcontent').hide();
            $('#modalbg').hide();
        };

        this.showModal=function(content)
        {
            $('#modalcontent').html('<div class="modalclose"><a class="button" onclick="ui.closeModal();">close</a></div>');
            $('#modalcontent').append(content);
            $('#modalcontent').show();
            $('#modalbg').show();
        };

        this.importDialog=function()
        {
            var html='';
            html+='import:<br/><br/>';
            html+='<textarea id="serialized"></textarea>';
            html+='<br/>';
            html+='<br/>';
            html+='<a class="button" onclick="ui.scene.clear();ui.scene.deSerialize($(\'#serialized\').val());ui.closeModal();">import</a>';
            self.showModal(html);
        };

        this.exportDialog=function()
        {
            var html='';
            html+='export:<br/><br/>';
            html+='<textarea id="serialized"></textarea>';
            self.showModal(html);
            $('#serialized').val(self.scene.serialize());
        };

        this.updateOpParams=function(id)
        {
            self.showOpParams(self.scene.getOpById(id));
        };

        function getHandleBarHtml(name,obj)
        {
            var source   = $("#"+name).html();
            var template = Handlebars.compile(source);
            var context = obj;
            return template(context);
        }

        this.showOpParams=function(op)
        {
            watchPorts=[];

            var html = getHandleBarHtml('params_op_head',{op: op});

            var sourcePort = $("#params_port").html();
            var templatePort = Handlebars.compile(sourcePort);

            html += getHandleBarHtml('params_ports_head',{title:'in'});

            for(var i in op.portsIn)
            {
                if(op.portsIn[i].isLinked())
                {
                    op.portsIn[i].watchId='in_'+i;
                    watchPorts.push(op.portsIn[i]);
                }

                html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true } );
            }

            html += getHandleBarHtml('params_ports_head',{title:'out'});

            for(var i2 in op.portsOut)
            {
                if(op.portsOut[i2].getType()==OP_PORT_TYPE_VALUE)
                {
                    op.portsOut[i2].watchId='out_'+i2;
                    watchPorts.push(op.portsOut[i2]);
                }

                html += templatePort( {port: op.portsOut[i2],dirStr:"out",portnum:i2,isInput:false } );
            }


            html += getHandleBarHtml('params_op_foot',{op: op});


            $('#options').html(html);


           

            for(var ipo in op.portsOut)
            {


                (function (index)
                {
                    $('#portdelete_out_'+index).on('click',function(e)
                    {
                        op.portsOut[index].removeLinks();
                        self.showOpParams(op);
                    });
                })(ipo);
            }




            for(var ipi in op.portsIn)
            {
                

                (function (index)
                {
                    $('#portdelete_in_'+index).on('click',function(e)
                    {
                        op.portsIn[index].removeLinks();
                        self.showOpParams(op);
                    });
                })(ipi);
            }

            for(var ipii in op.portsIn)
            {
                (function (index)
                {
                    $('#portval_'+index).on('input',function(e)
                    {
                        op.portsIn[index].val=''+$('#portval_'+index).val();
                        // self.showOpParams(op);
                    });
                })(ipii);

            }

        };


        function doWatchPorts()
        {
            for(var i in watchPorts)
            {
                var id='.watchPortValue_'+watchPorts[i].watchId;
                $(id).html( watchPorts[i].val );
            }

            if(uiConfig.watchValuesInterval>0) setTimeout( doWatchPorts,uiConfig.watchValuesInterval);
        }
        doWatchPorts();




    };




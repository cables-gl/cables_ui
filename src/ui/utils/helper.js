/**
 * Helper functions
 *
 */

String.prototype.endl = function ()
{
    return this + "\n";
};


export function uniqueArray(arr)
{
    const u = {}, a = [];
    for (let i = 0, l = arr.length; i < l; ++i)
    {
        if (!u.hasOwnProperty(arr[i]))
        {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
}

// export function arrayContains(arr, obj)
// {
//     let i = arr.length;
//     while (i--)
//     {
//         if (arr[i] === obj)
//         {
//             return true;
//         }
//     }
//     return false;
// }

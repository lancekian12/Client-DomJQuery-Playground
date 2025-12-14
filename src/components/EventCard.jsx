
// const EventCard = (
//   title,
//   desc,
//   Icon,
//   actionText,
//   onAction,
//   onDoubleClick,
//   onMouseDown,
//   onMouseUp
// ) => {
//   return (
//     <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/40">
//       <div className="flex items-start gap-4">
//         <div className="w-12 h-12 rounded-full bg-slate-900/60 flex items-center justify-center text-sky-400">
//           {Icon ? <Icon size={20} /> : <FiMouse size={20} />}
//         </div>

//         <div className="flex-1">
//           <h4 className="text-slate-100 font-semibold mb-1">{title}</h4>
//           <p className="text-slate-400 text-sm mb-4">{desc}</p>

//           <div>
//             <button
//               id={actionText.toLowerCase().replace(/\s+/g, "-")}
//               onClick={onAction}
//               onDoubleClick={onDoubleClick}
//               onMouseDown={onMouseDown}
//               onMouseUp={onMouseUp}
//               className="px-4 py-2 rounded-md text-sm bg-sky-600 text-white"
//             >
//               {actionText}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EventCard;

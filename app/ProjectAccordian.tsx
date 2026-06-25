import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
 
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

export function ProjectsAccordian({ projects, showProjectDetails }: { projects: any[]; showProjectDetails: (project: any) => void }) {
  console.log("ProjectsAccordian props:", projects);
  return (
    <Accordion
      // type="single"
      // collapsible
    >
      <AccordionItem value="shipping">
        <AccordionTrigger>Projects</AccordionTrigger>
        <AccordionContent>

          {projects?.map((project: any) => (
            <Item key={project.id}>
              <ItemContent  style={{ cursor: "pointer" }} onClick={() => showProjectDetails(project)}>
                <ItemTitle>{project.name}</ItemTitle>
                {/* <ItemDescription>{project.description}</ItemDescription> */}
              </ItemContent>
            </Item>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
